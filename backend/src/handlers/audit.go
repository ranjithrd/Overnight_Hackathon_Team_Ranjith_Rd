package handlers

import (
	"backend/src/db"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/xuri/excelize/v2"
)

// FinancialSummaryResponse represents the high-level financial totals
type FinancialSummaryResponse struct {
	TotalAssets                int    `json:"total_assets" example:"1500000"`
	TotalDeposits              int    `json:"total_deposits" example:"1000000"`
	TotalLoansDisbursed        int    `json:"total_loans_disbursed" example:"500000"`
	TotalLoansOutstanding      int    `json:"total_loans_outstanding" example:"300000"`
	TotalLoansRepaid           int    `json:"total_loans_repaid" example:"200000"`
	TotalProfit                int    `json:"total_profit" example:"50000"`
	TotalInterestEarned        int    `json:"total_interest_earned" example:"75000"`
	TotalMembers               int64  `json:"total_members" example:"150"`
	BlockchainIntegrity        bool   `json:"blockchain_integrity" example:"true"`
	LastBlockchainVerification string `json:"last_blockchain_verification" example:"2025-12-05T10:30:00Z"`
}

// OutstandingLoanItem represents a single outstanding loan
type OutstandingLoanItem struct {
	LoanID                uint    `json:"loan_id" example:"123"`
	BorrowerID            uint    `json:"borrower_id" example:"45"`
	BorrowerName          string  `json:"borrower_name" example:"John Doe"`
	BorrowerPhone         string  `json:"borrower_phone" example:"+1234567890"`
	Amount                int     `json:"amount" example:"50000"`
	InterestRate          float64 `json:"interest_rate" example:"4.0"`
	DurationMonths        int     `json:"duration_months" example:"12"`
	DisbursedDate         string  `json:"disbursed_date" example:"2025-11-01T00:00:00Z"`
	ExpectedRepaymentDate string  `json:"expected_repayment_date" example:"2026-11-01T00:00:00Z"`
	TotalRepayment        int     `json:"total_repayment" example:"52000"`
	AmountRepaid          int     `json:"amount_repaid" example:"10000"`
	AmountOutstanding     int     `json:"amount_outstanding" example:"42000"`
	Status                string  `json:"status" example:"Approved"`
	Reason                string  `json:"reason" example:"Home renovation"`
	BlockchainVerified    bool    `json:"blockchain_verified" example:"true"`
	BlockchainHash        string  `json:"blockchain_hash" example:"0xabc123..."`
}

// OutstandingLoansResponse represents the outstanding loans list
type OutstandingLoansResponse struct {
	OutstandingLoans       []OutstandingLoanItem `json:"outstanding_loans"`
	TotalCount             int                   `json:"total_count" example:"1"`
	TotalOutstandingAmount int                   `json:"total_outstanding_amount" example:"42000"`
}

// AuditTransactionItem represents a single transaction for audit
type AuditTransactionItem struct {
	TransactionID         string `json:"transaction_id" example:"TXN-1001"`
	TransactionType       string `json:"transaction_type" example:"deposit"`
	UserID                uint   `json:"user_id" example:"45"`
	UserName              string `json:"user_name" example:"John Doe"`
	UserPhone             string `json:"user_phone" example:"+1234567890"`
	Amount                int    `json:"amount" example:"10000"`
	Reference             string `json:"reference" example:"BANK-TX-12345"`
	Timestamp             string `json:"timestamp" example:"2025-12-01T14:30:00Z"`
	LoanID                *uint  `json:"loan_id,omitempty" example:"123"`
	BlockchainVerified    bool   `json:"blockchain_verified" example:"true"`
	BlockchainHash        string `json:"blockchain_hash" example:"0xdef456..."`
	BlockchainBlockNumber *uint  `json:"blockchain_block_number,omitempty" example:"12345"`
	VerificationTimestamp string `json:"verification_timestamp" example:"2025-12-01T14:30:05Z"`
}

// AuditTransactionsResponse represents the transactions list
type AuditTransactionsResponse struct {
	Transactions                 []AuditTransactionItem `json:"transactions"`
	TotalCount                   int                    `json:"total_count" example:"3"`
	TotalAmount                  int                    `json:"total_amount" example:"65000"`
	BlockchainVerifiedCount      int                    `json:"blockchain_verified_count" example:"3"`
	BlockchainVerifiedPercentage float64                `json:"blockchain_verified_percentage" example:"100.0"`
}

// UserAuditReportResponse represents detailed audit report for a user
type UserAuditReportResponse struct {
	UserID                  uint    `json:"user_id" example:"45"`
	Name                    string  `json:"name" example:"John Doe"`
	PhoneNumber             string  `json:"phone_number" example:"+1234567890"`
	Role                    string  `json:"role" example:"member"`
	JoinedDate              string  `json:"joined_date" example:"2024-01-15T00:00:00Z"`
	TotalDeposits           int     `json:"total_deposits" example:"100000"`
	CurrentSavingsBalance   int     `json:"current_savings_balance" example:"80000"`
	CurrentSharesBalance    int     `json:"current_shares_balance" example:"50000"`
	TotalLoansTaken         int64   `json:"total_loans_taken" example:"3"`
	TotalLoansAmount        int     `json:"total_loans_amount" example:"150000"`
	TotalLoansRepaid        int     `json:"total_loans_repaid" example:"100000"`
	CurrentOutstanding      int     `json:"current_outstanding" example:"50000"`
	TransactionCount        int64   `json:"transaction_count" example:"25"`
	BlockchainVerifiedTrans int64   `json:"blockchain_verified_transactions" example:"25"`
	VerificationRate        float64 `json:"verification_rate" example:"100.0"`
	LastTransactionDate     string  `json:"last_transaction_date" example:"2025-12-05T10:00:00Z"`
}

// BlockchainStatusResponse represents blockchain integrity status
type BlockchainStatusResponse struct {
	BlockchainIntegrity       bool    `json:"blockchain_integrity" example:"true"`
	TotalTransactions         int64   `json:"total_transactions" example:"1500"`
	VerifiedTransactions      int64   `json:"verified_transactions" example:"1500"`
	UnverifiedTransactions    int64   `json:"unverified_transactions" example:"0"`
	VerificationRate          float64 `json:"verification_rate" example:"100.0"`
	LastVerificationTimestamp string  `json:"last_verification_timestamp" example:"2025-12-05T11:45:00Z"`
	LastBlockNumber           uint    `json:"last_block_number" example:"15000"`
	BlockchainHealth          string  `json:"blockchain_health" example:"healthy"`
	PendingVerifications      int64   `json:"pending_verifications" example:"0"`
}

// GetFinancialSummary godoc
// @Summary Get Financial Summary
// @Description Returns high-level financial totals for audit purposes
// @Tags audit
// @Produce json
// @Success 200 {object} FinancialSummaryResponse
// @Failure 500 {object} ErrorResponse
// @Security SessionAuth
// @Router /api/v1/audit/summary [get]
func GetFinancialSummary(c echo.Context) error {
	var totalDeposits int
	db.DB.Model(&db.Deposit{}).Select("COALESCE(SUM(amount), 0)").Scan(&totalDeposits)

	var totalLoansDisbursed int
	db.DB.Model(&db.Loan{}).Where("status IN ?", []string{"Approved", "Closed"}).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalLoansDisbursed)

	var totalLoansOutstanding int
	db.DB.Model(&db.Loan{}).Where("status = ?", "Approved").
		Select("COALESCE(SUM(outstanding_balance), 0)").Scan(&totalLoansOutstanding)

	totalLoansRepaid := totalLoansDisbursed - totalLoansOutstanding

	var totalInterestEarned int
	db.DB.Model(&db.LoanPayment{}).Select("COALESCE(SUM(interest_amount), 0)").Scan(&totalInterestEarned)

	totalAssets := totalDeposits
	totalProfit := totalInterestEarned

	var totalMembers int64
	db.DB.Model(&db.User{}).Where("role = ?", "member").Count(&totalMembers)

	// Check blockchain integrity
	var lastBlock db.Block
	db.DB.Order("block_number DESC").First(&lastBlock)

	integrityCheck, _ := db.VerifyEntireChain()

	response := FinancialSummaryResponse{
		TotalAssets:                totalAssets,
		TotalDeposits:              totalDeposits,
		TotalLoansDisbursed:        totalLoansDisbursed,
		TotalLoansOutstanding:      totalLoansOutstanding,
		TotalLoansRepaid:           totalLoansRepaid,
		TotalProfit:                totalProfit,
		TotalInterestEarned:        totalInterestEarned,
		TotalMembers:               totalMembers,
		BlockchainIntegrity:        integrityCheck,
		LastBlockchainVerification: time.Now().Format(time.RFC3339),
	}

	return c.JSON(http.StatusOK, response)
}

// GetOutstandingLoans godoc
// @Summary Get Outstanding Loans
// @Description Returns all currently outstanding loans with borrower details
// @Tags audit
// @Produce json
// @Param status query string false "Filter by status"
// @Param sort query string false "Sort field (amount, created_at, borrower_name)"
// @Param order query string false "Sort order (asc, desc)"
// @Success 200 {object} OutstandingLoansResponse
// @Failure 500 {object} ErrorResponse
// @Security SessionAuth
// @Router /api/v1/audit/loans/outstanding [get]
func GetOutstandingLoans(c echo.Context) error {
	status := c.QueryParam("status")
	sortField := c.QueryParam("sort")
	sortOrder := c.QueryParam("order")

	query := db.DB.Model(&db.Loan{}).Preload("Borrower")

	if status != "" {
		query = query.Where("status = ?", status)
	} else {
		query = query.Where("status = ?", "Approved")
	}

	// Apply sorting
	orderClause := "created_at DESC"
	if sortField != "" {
		if sortOrder == "asc" {
			orderClause = sortField + " ASC"
		} else {
			orderClause = sortField + " DESC"
		}
	}
	query = query.Order(orderClause)

	var loans []db.Loan
	if err := query.Find(&loans).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch loans"})
	}

	var outstandingLoans []OutstandingLoanItem
	totalOutstanding := 0

	for _, loan := range loans {
		var block db.Block
		blockchainVerified := false
		blockchainHash := ""

		// Find the first transaction for this loan
		var txs []db.Transaction
		db.DB.Model(&loan).Association("Transactions").Find(&txs)
		if len(txs) > 0 {
			db.DB.Where("transaction_id = ?", txs[0].TransactionID).First(&block)
			if block.EthereumTxHash != "" {
				blockchainVerified = true
				blockchainHash = block.EthereumTxHash
			}
		}

		disbursedDate := ""
		expectedRepaymentDate := ""
		if loan.DisbursedAt != nil {
			disbursedDate = time.Unix(*loan.DisbursedAt, 0).Format(time.RFC3339)
			expectedDate := time.Unix(*loan.DisbursedAt, 0).AddDate(0, loan.Duration, 0)
			expectedRepaymentDate = expectedDate.Format(time.RFC3339)
		}

		totalRepayment := loan.Principal + int(float64(loan.Principal)*loan.InterestRate/100.0)
		amountRepaid := loan.Principal - loan.OutstandingBalance

		item := OutstandingLoanItem{
			LoanID:                loan.ID,
			BorrowerID:            loan.BorrowerID,
			BorrowerName:          loan.Borrower.Name,
			BorrowerPhone:         loan.Borrower.PhoneNumber,
			Amount:                loan.Amount,
			InterestRate:          loan.InterestRate,
			DurationMonths:        loan.Duration,
			DisbursedDate:         disbursedDate,
			ExpectedRepaymentDate: expectedRepaymentDate,
			TotalRepayment:        totalRepayment,
			AmountRepaid:          amountRepaid,
			AmountOutstanding:     loan.OutstandingBalance,
			Status:                loan.Status,
			Reason:                loan.Reason,
			BlockchainVerified:    blockchainVerified,
			BlockchainHash:        blockchainHash,
		}

		outstandingLoans = append(outstandingLoans, item)
		totalOutstanding += loan.OutstandingBalance
	}

	response := OutstandingLoansResponse{
		OutstandingLoans:       outstandingLoans,
		TotalCount:             len(outstandingLoans),
		TotalOutstandingAmount: totalOutstanding,
	}

	return c.JSON(http.StatusOK, response)
}

// GetAllTransactions godoc
// @Summary Get All Transactions
// @Description Returns all transactions for audit trail with filtering options
// @Tags audit
// @Produce json
// @Param type query string false "Filter by transaction type"
// @Param start_date query string false "Filter from date (ISO 8601)"
// @Param end_date query string false "Filter to date (ISO 8601)"
// @Param user_id query int false "Filter by user ID"
// @Param verified_only query boolean false "Show only blockchain-verified"
// @Param limit query int false "Records per page (default 100)"
// @Param offset query int false "Pagination offset (default 0)"
// @Success 200 {object} AuditTransactionsResponse
// @Failure 500 {object} ErrorResponse
// @Security SessionAuth
// @Router /api/v1/audit/transactions [get]
func GetAllTransactions(c echo.Context) error {
	txType := c.QueryParam("type")
	startDate := c.QueryParam("start_date")
	endDate := c.QueryParam("end_date")
	userIDStr := c.QueryParam("user_id")
	verifiedOnly := c.QueryParam("verified_only") == "true"
	limitStr := c.QueryParam("limit")
	offsetStr := c.QueryParam("offset")

	limit := 100
	offset := 0
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}
	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil {
			offset = o
		}
	}

	query := db.DB.Model(&db.Transaction{})

	if txType != "" {
		query = query.Where("type = ?", txType)
	}

	if startDate != "" {
		if t, err := time.Parse(time.RFC3339, startDate); err == nil {
			query = query.Where("created_at >= ?", t)
		}
	}

	if endDate != "" {
		if t, err := time.Parse(time.RFC3339, endDate); err == nil {
			query = query.Where("created_at <= ?", t)
		}
	}

	if userIDStr != "" {
		if userID, err := strconv.Atoi(userIDStr); err == nil {
			query = query.Where("from_account LIKE ? OR to_account LIKE ?",
				fmt.Sprintf("%%-%d", userID), fmt.Sprintf("%%-%d", userID))
		}
	}

	var totalCount int64
	query.Count(&totalCount)

	var transactions []db.Transaction
	if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&transactions).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch transactions"})
	}

	var auditTransactions []AuditTransactionItem
	totalAmount := 0
	verifiedCount := 0

	for _, tx := range transactions {
		var block db.Block
		db.DB.Where("transaction_id = ?", tx.TransactionID).First(&block)

		blockchainVerified := block.EthereumTxHash != ""

		if verifiedOnly && !blockchainVerified {
			continue
		}

		var blockNumber *uint
		if block.BlockNumber > 0 {
			blockNumber = &block.BlockNumber
		}

		// Extract user info from accounts
		var userID uint
		var userName, userPhone string
		// Simplified - you may need more sophisticated parsing
		fmt.Sscanf(tx.FromAccount, "USER-%d", &userID)
		if userID > 0 {
			var user db.User
			if db.DB.First(&user, userID).Error == nil {
				userName = user.Name
				userPhone = user.PhoneNumber
			}
		}

		item := AuditTransactionItem{
			TransactionID:         tx.TransactionID,
			TransactionType:       tx.Type,
			UserID:                userID,
			UserName:              userName,
			UserPhone:             userPhone,
			Amount:                tx.Amount,
			Reference:             tx.TransactionID,
			Timestamp:             tx.CreatedAt.Format(time.RFC3339),
			BlockchainVerified:    blockchainVerified,
			BlockchainHash:        block.EthereumTxHash,
			BlockchainBlockNumber: blockNumber,
			VerificationTimestamp: block.CreatedAt.Format(time.RFC3339),
		}

		auditTransactions = append(auditTransactions, item)
		totalAmount += tx.Amount
		if blockchainVerified {
			verifiedCount++
		}
	}

	verificationPercentage := 0.0
	if len(auditTransactions) > 0 {
		verificationPercentage = float64(verifiedCount) / float64(len(auditTransactions)) * 100.0
	}

	response := AuditTransactionsResponse{
		Transactions:                 auditTransactions,
		TotalCount:                   int(totalCount),
		TotalAmount:                  totalAmount,
		BlockchainVerifiedCount:      verifiedCount,
		BlockchainVerifiedPercentage: verificationPercentage,
	}

	return c.JSON(http.StatusOK, response)
}

// ExportTransactions godoc
// @Summary Export Transactions to Excel/CSV
// @Description Exports all transactions to Excel or CSV format with blockchain verification status
// @Tags audit
// @Produce application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Produce text/csv
// @Param type query string false "Filter by transaction type"
// @Param start_date query string false "Filter from date (ISO 8601)"
// @Param end_date query string false "Filter to date (ISO 8601)"
// @Param user_id query int false "Filter by user ID"
// @Param format query string false "Export format (excel, csv)"
// @Success 200 {file} file "Excel or CSV file"
// @Failure 500 {object} ErrorResponse
// @Security SessionAuth
// @Router /api/v1/audit/transactions/export [get]
func ExportTransactions(c echo.Context) error {
	format := c.QueryParam("format")
	if format == "" {
		format = "excel"
	}

	// Reuse the same query logic
	txType := c.QueryParam("type")
	startDate := c.QueryParam("start_date")
	endDate := c.QueryParam("end_date")
	userIDStr := c.QueryParam("user_id")

	query := db.DB.Model(&db.Transaction{})

	if txType != "" {
		query = query.Where("type = ?", txType)
	}
	if startDate != "" {
		if t, err := time.Parse(time.RFC3339, startDate); err == nil {
			query = query.Where("created_at >= ?", t)
		}
	}
	if endDate != "" {
		if t, err := time.Parse(time.RFC3339, endDate); err == nil {
			query = query.Where("created_at <= ?", t)
		}
	}
	if userIDStr != "" {
		if userID, err := strconv.Atoi(userIDStr); err == nil {
			query = query.Where("from_account LIKE ? OR to_account LIKE ?",
				fmt.Sprintf("%%-%d", userID), fmt.Sprintf("%%-%d", userID))
		}
	}

	var transactions []db.Transaction
	if err := query.Order("created_at DESC").Find(&transactions).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch transactions"})
	}

	if format == "excel" {
		return exportToExcel(c, transactions)
	}
	return exportToCSV(c, transactions)
}

func exportToExcel(c echo.Context, transactions []db.Transaction) error {
	f := excelize.NewFile()
	defer f.Close()

	sheetName := "Transactions"
	index, _ := f.NewSheet(sheetName)
	f.SetActiveSheet(index)

	// Headers
	headers := []string{"Transaction ID", "Date & Time", "Type", "User ID", "User Name", "User Phone",
		"Amount", "Reference", "Loan ID", "Blockchain Verified", "Blockchain Hash", "Block Number", "Verification Time"}

	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// Data
	for i, tx := range transactions {
		row := i + 2
		var block db.Block
		db.DB.Where("transaction_id = ?", tx.TransactionID).First(&block)

		verified := "No"
		if block.EthereumTxHash != "" {
			verified = "Yes"
		}

		var userID uint
		var userName, userPhone string
		fmt.Sscanf(tx.FromAccount, "USER-%d", &userID)
		if userID > 0 {
			var user db.User
			if db.DB.First(&user, userID).Error == nil {
				userName = user.Name
				userPhone = user.PhoneNumber
			}
		}

		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), tx.TransactionID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), tx.CreatedAt.Format(time.RFC3339))
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), tx.Type)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), userID)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), userName)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), userPhone)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), tx.Amount)
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), tx.TransactionID)
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), "")
		f.SetCellValue(sheetName, fmt.Sprintf("J%d", row), verified)
		f.SetCellValue(sheetName, fmt.Sprintf("K%d", row), block.EthereumTxHash)
		f.SetCellValue(sheetName, fmt.Sprintf("L%d", row), block.BlockNumber)
		f.SetCellValue(sheetName, fmt.Sprintf("M%d", row), block.CreatedAt.Format(time.RFC3339))
	}

	filename := fmt.Sprintf("transactions_export_%s.xlsx", time.Now().Format("2006-01-02"))

	c.Response().Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	return f.Write(c.Response().Writer)
}

func exportToCSV(c echo.Context, transactions []db.Transaction) error {
	filename := fmt.Sprintf("transactions_export_%s.csv", time.Now().Format("2006-01-02"))

	c.Response().Header().Set("Content-Type", "text/csv")
	c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

	// CSV headers
	fmt.Fprintf(c.Response().Writer, "Transaction ID,Date & Time,Type,User ID,User Name,User Phone,Amount,Reference,Loan ID,Blockchain Verified,Blockchain Hash,Block Number,Verification Time\n")

	for _, tx := range transactions {
		var block db.Block
		db.DB.Where("transaction_id = ?", tx.TransactionID).First(&block)

		verified := "No"
		if block.EthereumTxHash != "" {
			verified = "Yes"
		}

		var userID uint
		var userName, userPhone string
		fmt.Sscanf(tx.FromAccount, "USER-%d", &userID)
		if userID > 0 {
			var user db.User
			if db.DB.First(&user, userID).Error == nil {
				userName = user.Name
				userPhone = user.PhoneNumber
			}
		}

		fmt.Fprintf(c.Response().Writer, "%s,%s,%s,%d,%s,%s,%d,%s,,%s,%s,%d,%s\n",
			tx.TransactionID,
			tx.CreatedAt.Format(time.RFC3339),
			tx.Type,
			userID,
			userName,
			userPhone,
			tx.Amount,
			tx.TransactionID,
			verified,
			block.EthereumTxHash,
			block.BlockNumber,
			block.CreatedAt.Format(time.RFC3339),
		)
	}

	return nil
}

// GetUserAuditReport godoc
// @Summary Get User Audit Report
// @Description Returns detailed audit report for a specific user
// @Tags audit
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} UserAuditReportResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Security SessionAuth
// @Router /api/v1/audit/users/{id} [get]
func GetUserAuditReport(c echo.Context) error {
	idParam := c.Param("id")
	userID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid user ID"})
	}

	var user db.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "User not found"})
	}

	var totalDeposits int
	db.DB.Model(&db.Deposit{}).Where("user_id = ?", userID).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalDeposits)

	var savingsBalance int
	db.DB.Model(&db.Deposit{}).Where("user_id = ? AND type = ?", userID, "savings").
		Select("COALESCE(SUM(amount), 0)").Scan(&savingsBalance)

	var sharesBalance int
	db.DB.Model(&db.Deposit{}).Where("user_id = ? AND type = ?", userID, "shares").
		Select("COALESCE(SUM(amount), 0)").Scan(&sharesBalance)

	var loanCount int64
	db.DB.Model(&db.Loan{}).Where("borrower_id = ?", userID).Count(&loanCount)

	var totalLoansAmount int
	db.DB.Model(&db.Loan{}).Where("borrower_id = ?", userID).
		Select("COALESCE(SUM(amount), 0)").Scan(&totalLoansAmount)

	var currentOutstanding int
	db.DB.Model(&db.Loan{}).Where("borrower_id = ? AND status = ?", userID, "Approved").
		Select("COALESCE(SUM(outstanding_balance), 0)").Scan(&currentOutstanding)

	totalRepaid := totalLoansAmount - currentOutstanding

	var txCount int64
	db.DB.Model(&db.Transaction{}).
		Where("from_account LIKE ? OR to_account LIKE ?",
			fmt.Sprintf("%%-%d", userID), fmt.Sprintf("%%-%d", userID)).
		Count(&txCount)

	var verifiedCount int64
	db.DB.Table("transactions").
		Joins("JOIN blocks ON transactions.transaction_id = blocks.transaction_id").
		Where("(transactions.from_account LIKE ? OR transactions.to_account LIKE ?) AND blocks.ethereum_tx_hash != ''",
			fmt.Sprintf("%%-%d", userID), fmt.Sprintf("%%-%d", userID)).
		Count(&verifiedCount)

	verificationRate := 0.0
	if txCount > 0 {
		verificationRate = float64(verifiedCount) / float64(txCount) * 100.0
	}

	var lastTx db.Transaction
	lastTxDate := ""
	if db.DB.Where("from_account LIKE ? OR to_account LIKE ?",
		fmt.Sprintf("%%-%d", userID), fmt.Sprintf("%%-%d", userID)).
		Order("created_at DESC").First(&lastTx).Error == nil {
		lastTxDate = lastTx.CreatedAt.Format(time.RFC3339)
	}

	response := UserAuditReportResponse{
		UserID:                  user.ID,
		Name:                    user.Name,
		PhoneNumber:             user.PhoneNumber,
		Role:                    user.Role,
		JoinedDate:              user.CreatedAt.Format(time.RFC3339),
		TotalDeposits:           totalDeposits,
		CurrentSavingsBalance:   savingsBalance,
		CurrentSharesBalance:    sharesBalance,
		TotalLoansTaken:         loanCount,
		TotalLoansAmount:        totalLoansAmount,
		TotalLoansRepaid:        totalRepaid,
		CurrentOutstanding:      currentOutstanding,
		TransactionCount:        txCount,
		BlockchainVerifiedTrans: verifiedCount,
		VerificationRate:        verificationRate,
		LastTransactionDate:     lastTxDate,
	}

	return c.JSON(http.StatusOK, response)
}

// GetBlockchainStatus godoc
// @Summary Get Blockchain Verification Status
// @Description Returns overall blockchain integrity and verification statistics
// @Tags audit
// @Produce json
// @Success 200 {object} BlockchainStatusResponse
// @Failure 500 {object} ErrorResponse
// @Security SessionAuth
// @Router /api/v1/audit/blockchain/status [get]
func GetBlockchainStatus(c echo.Context) error {
	var totalTx int64
	db.DB.Model(&db.Transaction{}).Count(&totalTx)

	var verifiedTx int64
	db.DB.Table("blocks").Where("ethereum_tx_hash != '' AND ethereum_tx_hash IS NOT NULL").Count(&verifiedTx)

	unverifiedTx := totalTx - verifiedTx

	verificationRate := 0.0
	if totalTx > 0 {
		verificationRate = float64(verifiedTx) / float64(totalTx) * 100.0
	}

	var lastBlock db.Block
	db.DB.Order("block_number DESC").First(&lastBlock)

	integrityCheck, _ := db.VerifyEntireChain()

	health := "healthy"
	if verificationRate < 90 {
		health = "warning"
	}
	if verificationRate < 50 {
		health = "critical"
	}

	pendingVerifications := totalTx - verifiedTx

	response := BlockchainStatusResponse{
		BlockchainIntegrity:       integrityCheck,
		TotalTransactions:         totalTx,
		VerifiedTransactions:      verifiedTx,
		UnverifiedTransactions:    unverifiedTx,
		VerificationRate:          verificationRate,
		LastVerificationTimestamp: time.Now().Format(time.RFC3339),
		LastBlockNumber:           lastBlock.BlockNumber,
		BlockchainHealth:          health,
		PendingVerifications:      pendingVerifications,
	}

	return c.JSON(http.StatusOK, response)
}
