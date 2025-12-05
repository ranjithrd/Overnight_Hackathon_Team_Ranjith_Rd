package blockchain

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"log"
	"math/big"
	"os"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

var (
	client          *ethclient.Client
	contractAddress common.Address
	privateKey      *ecdsa.PrivateKey
	contractABI     abi.ABI
)

// TransactionLedgerABI is the ABI for the TransactionLedger contract
const TransactionLedgerABI = `[
	{
		"inputs": [
			{"internalType": "string", "name": "transactionId", "type": "string"},
			{"internalType": "string", "name": "txType", "type": "string"},
			{"internalType": "string", "name": "fromAccount", "type": "string"},
			{"internalType": "string", "name": "toAccount", "type": "string"},
			{"internalType": "uint256", "name": "amount", "type": "uint256"},
			{"internalType": "string", "name": "status", "type": "string"},
			{"internalType": "string", "name": "description", "type": "string"}
		],
		"name": "recordTransaction",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{"internalType": "string", "name": "transactionId", "type": "string"}
		],
		"name": "getTransaction",
		"outputs": [
			{
				"components": [
					{"internalType": "string", "name": "transactionId", "type": "string"},
					{"internalType": "string", "name": "txType", "type": "string"},
					{"internalType": "string", "name": "fromAccount", "type": "string"},
					{"internalType": "string", "name": "toAccount", "type": "string"},
					{"internalType": "uint256", "name": "amount", "type": "uint256"},
					{"internalType": "string", "name": "status", "type": "string"},
					{"internalType": "string", "name": "description", "type": "string"},
					{"internalType": "uint256", "name": "timestamp", "type": "uint256"},
					{"internalType": "uint256", "name": "blockNumber", "type": "uint256"},
					{"internalType": "address", "name": "submittedBy", "type": "address"}
				],
				"internalType": "struct TransactionLedger.Transaction",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{"internalType": "string", "name": "transactionId", "type": "string"},
			{"internalType": "string", "name": "txType", "type": "string"},
			{"internalType": "string", "name": "fromAccount", "type": "string"},
			{"internalType": "string", "name": "toAccount", "type": "string"},
			{"internalType": "uint256", "name": "amount", "type": "uint256"}
		],
		"name": "verifyTransaction",
		"outputs": [
			{"internalType": "bool", "name": "", "type": "bool"}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTransactionCount",
		"outputs": [
			{"internalType": "uint256", "name": "", "type": "uint256"}
		],
		"stateMutability": "view",
		"type": "function"
	}
]`

// InitEthereum initializes the Ethereum client and loads configuration
func InitEthereum() error {
	rpcURL := os.Getenv("SEPOLIA_RPC_URL")
	if rpcURL == "" {
		return fmt.Errorf("SEPOLIA_RPC_URL not set in environment")
	}

	contractAddrStr := os.Getenv("CONTRACT_ADDRESS")
	if contractAddrStr == "" {
		return fmt.Errorf("CONTRACT_ADDRESS not set in environment")
	}

	privateKeyHex := os.Getenv("PRIVATE_KEY")
	if privateKeyHex == "" {
		return fmt.Errorf("PRIVATE_KEY not set in environment")
	}

	// Connect to Sepolia
	var err error
	client, err = ethclient.Dial(rpcURL)
	if err != nil {
		return fmt.Errorf("failed to connect to Sepolia: %w", err)
	}

	// Verify connection
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	chainID, err := client.ChainID(ctx)
	if err != nil {
		return fmt.Errorf("failed to get chain ID: %w", err)
	}
	log.Printf("Connected to Sepolia (Chain ID: %s)", chainID.String())

	// Load contract address
	contractAddress = common.HexToAddress(contractAddrStr)
	log.Printf("Using contract at: %s", contractAddress.Hex())

	// Load private key
	privateKey, err = crypto.HexToECDSA(strings.TrimPrefix(privateKeyHex, "0x"))
	if err != nil {
		return fmt.Errorf("failed to load private key: %w", err)
	}

	// Load contract ABI
	contractABI, err = abi.JSON(strings.NewReader(TransactionLedgerABI))
	if err != nil {
		return fmt.Errorf("failed to parse contract ABI: %w", err)
	}

	log.Println("Ethereum client initialized successfully")
	return nil
}

// RecordTransactionOnSepolia records full transaction data to the Sepolia blockchain
// Returns the Ethereum transaction hash
func RecordTransactionOnSepolia(
	transactionID string,
	txType string,
	fromAccount string,
	toAccount string,
	amount int64,
	status string,
	description string,
) (string, error) {
	if client == nil {
		return "", fmt.Errorf("ethereum client not initialized")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Get the public address from private key
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return "", fmt.Errorf("error casting public key to ECDSA")
	}
	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)

	// Get nonce
	nonce, err := client.PendingNonceAt(ctx, fromAddress)
	if err != nil {
		return "", fmt.Errorf("failed to get nonce: %w", err)
	}

	// Get gas price
	gasPrice, err := client.SuggestGasPrice(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get gas price: %w", err)
	}

	// Get chain ID
	chainID, err := client.ChainID(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get chain ID: %w", err)
	}

	// Convert amount to big.Int
	amountBig := big.NewInt(amount)

	// Pack the transaction data
	data, err := contractABI.Pack("recordTransaction",
		transactionID,
		txType,
		fromAccount,
		toAccount,
		amountBig,
		status,
		description,
	)
	if err != nil {
		return "", fmt.Errorf("failed to pack transaction data: %w", err)
	}

	// Estimate gas limit (higher because we're storing more data)
	gasLimit := uint64(500000) // Increased for full data storage

	// Create the transaction
	tx := types.NewTx(&types.LegacyTx{
		Nonce:    nonce,
		To:       &contractAddress,
		Value:    big.NewInt(0),
		Gas:      gasLimit,
		GasPrice: gasPrice,
		Data:     data,
	})

	// Sign the transaction
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign transaction: %w", err)
	}

	// Send the transaction
	err = client.SendTransaction(ctx, signedTx)
	if err != nil {
		return "", fmt.Errorf("failed to send transaction: %w", err)
	}

	txHash := signedTx.Hash().Hex()
	log.Printf("Transaction recorded on Sepolia: TX=%s, TxID=%s", txHash, transactionID)

	// Wait for transaction receipt (optional - can be async)
	go waitForReceipt(signedTx.Hash(), transactionID)

	return txHash, nil
}

// waitForReceipt waits for transaction confirmation (runs in background)
func waitForReceipt(txHash common.Hash, transactionID string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	receipt, err := waitForTransactionReceipt(ctx, txHash)
	if err != nil {
		log.Printf("ERROR: Transaction %s failed: %v", txHash.Hex(), err)
		return
	}

	if receipt.Status == 1 {
		log.Printf("✓ Payment %s confirmed on Sepolia (Block: %d, Gas: %d)",
			transactionID, receipt.BlockNumber.Uint64(), receipt.GasUsed)
	} else {
		log.Printf("✗ Payment %s transaction reverted on Sepolia", transactionID)
	}
}

// waitForTransactionReceipt polls for transaction receipt
func waitForTransactionReceipt(ctx context.Context, txHash common.Hash) (*types.Receipt, error) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-ticker.C:
			receipt, err := client.TransactionReceipt(ctx, txHash)
			if err == nil {
				return receipt, nil
			}
			// Continue polling if receipt not found yet
		}
	}
}

// VerifyTransactionOnSepolia verifies full transaction data against the Sepolia blockchain
func VerifyTransactionOnSepolia(
	transactionID string,
	txType string,
	fromAccount string,
	toAccount string,
	amount int64,
) (bool, error) {
	if client == nil {
		return false, fmt.Errorf("ethereum client not initialized")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	amountBig := big.NewInt(amount)

	// Pack the call data
	data, err := contractABI.Pack("verifyTransaction",
		transactionID,
		txType,
		fromAccount,
		toAccount,
		amountBig,
	)
	if err != nil {
		return false, fmt.Errorf("failed to pack call data: %w", err)
	}

	// Call the contract
	msg := ethereum.CallMsg{
		To:   &contractAddress,
		Data: data,
	}
	result, err := client.CallContract(ctx, msg, nil)
	if err != nil {
		return false, fmt.Errorf("failed to call contract: %w", err)
	}

	// Unpack the result
	var isValid bool
	err = contractABI.UnpackIntoInterface(&isValid, "verifyTransaction", result)
	if err != nil {
		return false, fmt.Errorf("failed to unpack result: %w", err)
	}

	return isValid, nil
}

// GetTransactionFromSepolia retrieves full transaction data from Sepolia
func GetTransactionFromSepolia(transactionID string) (map[string]interface{}, error) {
	if client == nil {
		return nil, fmt.Errorf("ethereum client not initialized")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Pack the call data
	data, err := contractABI.Pack("getTransaction", transactionID)
	if err != nil {
		return nil, fmt.Errorf("failed to pack call data: %w", err)
	}

	// Call the contract
	msg := ethereum.CallMsg{
		To:   &contractAddress,
		Data: data,
	}
	result, err := client.CallContract(ctx, msg, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to call contract: %w", err)
	}

	// Unpack the result into a struct
	type SepoliaTransaction struct {
		TransactionId string
		TxType        string
		FromAccount   string
		ToAccount     string
		Amount        *big.Int
		Status        string
		Description   string
		Timestamp     *big.Int
		BlockNumber   *big.Int
		SubmittedBy   common.Address
	}

	var tx SepoliaTransaction
	err = contractABI.UnpackIntoInterface(&tx, "getTransaction", result)
	if err != nil {
		return nil, fmt.Errorf("failed to unpack result: %w", err)
	}

	return map[string]interface{}{
		"transaction_id": tx.TransactionId,
		"type":           tx.TxType,
		"from_account":   tx.FromAccount,
		"to_account":     tx.ToAccount,
		"amount":         tx.Amount.Int64(),
		"status":         tx.Status,
		"description":    tx.Description,
		"timestamp":      tx.Timestamp.Int64(),
		"block_number":   tx.BlockNumber.Uint64(),
		"submitted_by":   tx.SubmittedBy.Hex(),
	}, nil
}
