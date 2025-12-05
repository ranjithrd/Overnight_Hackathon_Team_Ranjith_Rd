// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TransactionLedger
 * @dev Full decentralized ledger for cooperative banking system
 * ALL transaction data is stored on Sepolia - no central database needed
 */
contract TransactionLedger {
    struct Transaction {
        string transactionId;
        string txType;          // payment, deposit, loan_status_change, etc.
        string fromAccount;
        string toAccount;
        uint256 amount;
        string status;
        string description;
        uint256 timestamp;
        uint256 blockNumber;
        address submittedBy;
    }

    // Full transaction data stored on-chain
    mapping(string => Transaction) public transactions;
    
    // Track all transaction IDs for enumeration
    string[] public transactionIds;
    
    // Mapping to check if transaction exists
    mapping(string => bool) public transactionExists;
    
    // Owner of the contract
    address public owner;

    // Event emitted when transaction is recorded (indexed for fast queries)
    event TransactionRecorded(
        string indexed transactionId,
        string txType,
        string fromAccount,
        string toAccount,
        uint256 amount,
        uint256 timestamp,
        address indexed submittedBy
    );

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Record a complete transaction on-chain
     * @param transactionId Unique transaction ID
     * @param txType Type of transaction (payment, deposit, etc.)
     * @param fromAccount Source account
     * @param toAccount Destination account
     * @param amount Transaction amount in smallest unit
     * @param status Transaction status
     * @param description Human-readable description
     */
    function recordTransaction(
        string memory transactionId,
        string memory txType,
        string memory fromAccount,
        string memory toAccount,
        uint256 amount,
        string memory status,
        string memory description
    ) public {
        require(bytes(transactionId).length > 0, "Transaction ID cannot be empty");
        require(!transactionExists[transactionId], "Transaction already exists");

        Transaction memory newTx = Transaction({
            transactionId: transactionId,
            txType: txType,
            fromAccount: fromAccount,
            toAccount: toAccount,
            amount: amount,
            status: status,
            description: description,
            timestamp: block.timestamp,
            blockNumber: block.number,
            submittedBy: msg.sender
        });

        transactions[transactionId] = newTx;
        transactionIds.push(transactionId);
        transactionExists[transactionId] = true;

        emit TransactionRecorded(
            transactionId,
            txType,
            fromAccount,
            toAccount,
            amount,
            block.timestamp,
            msg.sender
        );
    }

    /**
     * @dev Get full transaction details from blockchain
     * @param transactionId The transaction ID to look up
     * @return Complete transaction data
     */
    function getTransaction(string memory transactionId) public view returns (Transaction memory) {
        require(transactionExists[transactionId], "Transaction does not exist");
        return transactions[transactionId];
    }

    /**
     * @dev Get total number of transactions
     * @return Total count
     */
    function getTransactionCount() public view returns (uint256) {
        return transactionIds.length;
    }

    /**
     * @dev Get transaction ID by index
     * @param index Index in the array
     * @return Transaction ID
     */
    function getTransactionIdByIndex(uint256 index) public view returns (string memory) {
        require(index < transactionIds.length, "Index out of bounds");
        return transactionIds[index];
    }

    /**
     * @dev Verify transaction data matches on-chain record
     * @param transactionId Transaction ID to verify
     * @param txType Expected transaction type
     * @param fromAccount Expected source account
     * @param toAccount Expected destination account
     * @param amount Expected amount
     * @return True if all fields match
     */
    function verifyTransaction(
        string memory transactionId,
        string memory txType,
        string memory fromAccount,
        string memory toAccount,
        uint256 amount
    ) public view returns (bool) {
        if (!transactionExists[transactionId]) {
            return false;
        }

        Transaction memory tx = transactions[transactionId];
        
        return (
            keccak256(bytes(tx.txType)) == keccak256(bytes(txType)) &&
            keccak256(bytes(tx.fromAccount)) == keccak256(bytes(fromAccount)) &&
            keccak256(bytes(tx.toAccount)) == keccak256(bytes(toAccount)) &&
            tx.amount == amount
        );
    }
}
