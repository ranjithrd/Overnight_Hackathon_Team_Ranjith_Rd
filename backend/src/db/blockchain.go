package db

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"backend/src/blockchain"
)

const GenesisBlockHash = "0000000000000000000000000000000000000000000000000000000000000000"

func InitializeBlockchain() error {
	var count int64
	if err := DB.Model(&Block{}).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check blockchain: %w", err)
	}

	if count == 0 {
		genesisBlock := &Block{
			BlockNumber:     0,
			PreviousHash:    GenesisBlockHash,
			TransactionID:   "GENESIS",
			TransactionHash: GenesisBlockHash,
			BlockHash:       GenesisBlockHash,
			Timestamp:       time.Now().Unix(),
			Nonce:           0,
		}

		if err := DB.Create(genesisBlock).Error; err != nil {
			return fmt.Errorf("failed to create genesis block: %w", err)
		}

		log.Println("Genesis block created successfully")
	}

	return nil
}

func CreateBlockForTransaction(txID string) (*Block, error) {
	var transaction Transaction
	if err := DB.Where("transaction_id = ?", txID).First(&transaction).Error; err != nil {
		return nil, fmt.Errorf("transaction not found: %w", err)
	}

	var existingBlock Block
	if err := DB.Where("transaction_id = ?", txID).First(&existingBlock).Error; err == nil {
		return nil, fmt.Errorf("block already exists for transaction: %s", txID)
	}

	var latestBlock Block
	if err := DB.Order("block_number DESC").First(&latestBlock).Error; err != nil {
		return nil, fmt.Errorf("failed to get latest block: %w", err)
	}

	txHash, err := hashTransaction(&transaction)
	if err != nil {
		return nil, fmt.Errorf("failed to hash transaction: %w", err)
	}

	newBlock := &Block{
		BlockNumber:     latestBlock.BlockNumber + 1,
		PreviousHash:    latestBlock.BlockHash,
		TransactionID:   txID,
		TransactionHash: txHash,
		Timestamp:       time.Now().Unix(),
		Nonce:           0,
	}

	blockHash := computeBlockHash(newBlock)
	newBlock.BlockHash = blockHash

	// Record full transaction to Sepolia blockchain (source of truth)
	ethTxHash, err := blockchain.RecordTransactionOnSepolia(
		transaction.TransactionID,
		transaction.Type,
		transaction.FromAccount,
		transaction.ToAccount,
		int64(transaction.Amount),
		transaction.Status,
		transaction.Description,
	)
	if err != nil {
		log.Printf("WARNING: Failed to record on Sepolia: %v", err)
		// Continue without Sepolia - graceful degradation
	} else {
		newBlock.EthereumTxHash = ethTxHash
		log.Printf("Transaction recorded on Sepolia: %s", ethTxHash)
	}

	if err := DB.Create(newBlock).Error; err != nil {
		return nil, fmt.Errorf("failed to create block: %w", err)
	}

	log.Printf("Block #%d created for transaction %s", newBlock.BlockNumber, txID)
	return newBlock, nil
}

func VerifyBlock(blockNumber uint) (bool, error) {
	var block Block
	if err := DB.Where("block_number = ?", blockNumber).First(&block).Error; err != nil {
		return false, fmt.Errorf("block not found: %w", err)
	}

	if block.BlockNumber == 0 {
		return block.BlockHash == GenesisBlockHash &&
			block.PreviousHash == GenesisBlockHash &&
			block.TransactionID == "GENESIS", nil
	}

	var transaction Transaction
	if err := DB.Where("transaction_id = ?", block.TransactionID).First(&transaction).Error; err != nil {
		return false, fmt.Errorf("transaction not found: %w", err)
	}

	txHash, err := hashTransaction(&transaction)
	if err != nil {
		return false, fmt.Errorf("failed to hash transaction: %w", err)
	}

	if txHash != block.TransactionHash {
		return false, fmt.Errorf("transaction hash mismatch")
	}

	computedHash := computeBlockHash(&block)
	if computedHash != block.BlockHash {
		return false, fmt.Errorf("block hash mismatch")
	}

	var previousBlock Block
	if err := DB.Where("block_number = ?", block.BlockNumber-1).First(&previousBlock).Error; err != nil {
		return false, fmt.Errorf("previous block not found: %w", err)
	}

	if block.PreviousHash != previousBlock.BlockHash {
		return false, fmt.Errorf("previous hash mismatch")
	}

	return true, nil
}

func VerifyEntireChain() (bool, error) {
	var blocks []Block
	if err := DB.Order("block_number ASC").Find(&blocks).Error; err != nil {
		return false, fmt.Errorf("failed to fetch blocks: %w", err)
	}

	if len(blocks) == 0 {
		return false, fmt.Errorf("blockchain is empty")
	}

	for _, block := range blocks {
		// Verify local blockchain integrity
		valid, err := VerifyBlock(block.BlockNumber)
		if err != nil {
			return false, fmt.Errorf("block #%d verification failed: %w", block.BlockNumber, err)
		}
		if !valid {
			return false, fmt.Errorf("block #%d is invalid", block.BlockNumber)
		}

		// Verify against Sepolia if Ethereum tx hash exists
		if block.EthereumTxHash != "" && block.TransactionID != "GENESIS" {
			var transaction Transaction
			if err := DB.Where("transaction_id = ?", block.TransactionID).First(&transaction).Error; err != nil {
				log.Printf("WARNING: Transaction not found for block #%d: %v", block.BlockNumber, err)
				continue
			}

			sepoliaValid, err := blockchain.VerifyTransactionOnSepolia(
				transaction.TransactionID,
				transaction.Type,
				transaction.FromAccount,
				transaction.ToAccount,
				int64(transaction.Amount),
			)
			if err != nil {
				log.Printf("WARNING: Failed to verify block #%d on Sepolia: %v", block.BlockNumber, err)
				continue
			}

			if !sepoliaValid {
				return false, fmt.Errorf("block #%d data mismatch on Sepolia - TAMPERING DETECTED", block.BlockNumber)
			}
		}
	}

	log.Printf("Entire blockchain verified successfully (%d blocks)", len(blocks))
	return true, nil
}

func GetBlockByTransaction(txID string) (*Block, error) {
	var block Block
	if err := DB.Where("transaction_id = ?", txID).First(&block).Error; err != nil {
		return nil, fmt.Errorf("block not found for transaction: %w", err)
	}
	return &block, nil
}

func GetLatestBlock() (*Block, error) {
	var block Block
	if err := DB.Order("block_number DESC").First(&block).Error; err != nil {
		return nil, fmt.Errorf("failed to get latest block: %w", err)
	}
	return &block, nil
}

func GetBlockchainInfo() (map[string]interface{}, error) {
	var totalBlocks int64
	if err := DB.Model(&Block{}).Count(&totalBlocks).Error; err != nil {
		return nil, fmt.Errorf("failed to count blocks: %w", err)
	}

	latestBlock, err := GetLatestBlock()
	if err != nil {
		return nil, err
	}

	valid, err := VerifyEntireChain()
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"total_blocks":       totalBlocks,
		"latest_block":       latestBlock.BlockNumber,
		"latest_block_hash":  latestBlock.BlockHash,
		"chain_valid":        valid,
		"genesis_block_hash": GenesisBlockHash,
	}, nil
}

func hashTransaction(tx *Transaction) (string, error) {
	data := map[string]interface{}{
		"transaction_id": tx.TransactionID,
		"type":           tx.Type,
		"from_account":   tx.FromAccount,
		"to_account":     tx.ToAccount,
		"amount":         tx.Amount,
		"status":         tx.Status,
		"description":    tx.Description,
		"created_at":     tx.CreatedAt.Unix(),
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	hash := sha256.Sum256(jsonData)
	return hex.EncodeToString(hash[:]), nil
}

func computeBlockHash(block *Block) string {
	data := fmt.Sprintf("%d%s%s%s%d%d",
		block.BlockNumber,
		block.PreviousHash,
		block.TransactionID,
		block.TransactionHash,
		block.Timestamp,
		block.Nonce,
	)

	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}
