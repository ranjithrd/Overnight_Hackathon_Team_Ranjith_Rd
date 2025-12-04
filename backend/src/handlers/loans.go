package handlers

import (
	"backend/src/db"
	"backend/src/repos"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
)

var (
	loanRepoHandler      = repos.LoanRepo{}
	depositRepoHandler   = repos.DepositRepo{}
	interestRateRepo     = repos.InterestRateRepo{}
	transactionGenerator = generateTransactionID
)

type LoanSummary struct {
	ID                 uint    `json:"id" example:"1"`
	Amount             int     `json:"amount" example:"100000"`
	Principal          int     `json:"principal" example:"100000"`
	Duration           int     `json:"duration" example:"12"`
	InterestRate       float64 `json:"interest_rate" example:"12.5"`
	Status             string  `json:"status" example:"Approved"`
	Reason             string  `json:"reason" example:"Home renovation"`
	MonthlyPayment     int     `json:"monthly_payment" example:"9000"`
	OutstandingBalance int     `json:"outstanding_balance" example:"95000"`
	CreatedAt          string  `json:"created_at" example:"2025-01-15T10:00:00Z"`
}

type MemberLoansResponse struct {
	Loans               []LoanSummary `json:"loans"`
	TotalDue            int           `json:"total_due" example:"95000"`
	MonthlyPaymentTotal int           `json:"monthly_payment_total" example:"9000"`
}

type ManagerLoansResponse struct {
	RequestedLoans []LoanSummary `json:"requested_loans"`
	OtherLoans     []LoanSummary `json:"other_loans"`
}

type LoanDetailResponse struct {
	ID                 uint         `json:"id" example:"1"`
	Borrower           BorrowerInfo `json:"borrower"`
	ApprovedBy         *ManagerInfo `json:"approved_by,omitempty"`
	Amount             int          `json:"amount" example:"100000"`
	Principal          int          `json:"principal" example:"100000"`
	Duration           int          `json:"duration" example:"12"`
	InterestRate       float64      `json:"interest_rate" example:"12.5"`
	Status             string       `json:"status" example:"Approved"`
	Reason             string       `json:"reason" example:"Home renovation"`
	MonthlyPayment     int          `json:"monthly_payment" example:"9000"`
	OutstandingBalance int          `json:"outstanding_balance" example:"95000"`
	CreatedAt          string       `json:"created_at" example:"2025-01-15T10:00:00Z"`
}

type BorrowerInfo struct {
	ID          uint   `json:"id" example:"1"`
	Name        string `json:"name" example:"John Doe"`
	PhoneNumber string `json:"phone_number" example:"+1234567890"`
}

type ManagerInfo struct {
	ID   uint   `json:"id" example:"2"`
	Name string `json:"name" example:"Jane Manager"`
}

type UpdateLoanStatusRequest struct {
	Status string `json:"status" binding:"required" example:"Approved"`
}

type UpdateLoanStatusResponse struct {
	OK      bool   `json:"ok" example:"true"`
	Message string `json:"message" example:"Loan approved successfully"`
}

type RequestLoanRequest struct {
	Amount   int    `json:"amount" binding:"required" example:"100000"`
	Duration int    `json:"duration" binding:"required" example:"12"`
	Reason   string `json:"reason" binding:"required" example:"Home renovation"`
}

type RequestLoanResponse struct {
	OK     bool `json:"ok" example:"true"`
	LoanID uint `json:"loan_id" example:"1"`
}

type AddLoanRequest struct {
	BorrowerID   uint    `json:"borrower_id" binding:"required" example:"1"`
	Amount       int     `json:"amount" binding:"required" example:"100000"`
	Duration     int     `json:"duration" binding:"required" example:"12"`
	InterestRate float64 `json:"interest_rate" binding:"required" example:"12.5"`
	Reason       string  `json:"reason" example:"Home renovation"`
	Status       string  `json:"status" example:"Approved"`
}

type AddDepositRequest struct {
	UserID    uint   `json:"user_id" binding:"required" example:"1"`
	Amount    int    `json:"amount" binding:"required" example:"10000"`
	Reference string `json:"reference" example:"BANK-TX-12345"`
}

type AddDepositResponse struct {
	OK            bool   `json:"ok" example:"true"`
	TransactionID string `json:"transaction_id" example:"TXN-1234567890"`
}

type InterestRateResponse struct {
	Rates []InterestRateItem `json:"rates"`
}

type InterestRateItem struct {
	DurationMonths int     `json:"duration_months" example:"12"`
	Rate           float64 `json:"rate" example:"12.5"`
	EffectiveFrom  string  `json:"effective_from" example:"2025-01-01T00:00:00Z"`
}

type SetInterestRateRequest struct {
	DurationMonths int     `json:"duration_months" binding:"required" example:"12"`
	Rate           float64 `json:"rate" binding:"required" example:"12.5"`
}

// GetMemberLoans godoc
// @Summary Get member's loans
// @Description Returns list of loans for the authenticated member with summary statistics
// @Tags loans
// @Produce json
// @Security SessionAuth
// @Success 200 {object} MemberLoansResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/loans/member [get]
func GetMemberLoans(c echo.Context) error {
	user := c.Get("user").(*repos.UserWithSession)

	loans, err := loanRepoHandler.GetByBorrowerID(user.ID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch loans"})
	}

	var loanSummaries []LoanSummary
	totalDue := 0
	monthlyPaymentTotal := 0

	for _, loan := range loans {
		loanSummaries = append(loanSummaries, LoanSummary{
			ID:                 loan.ID,
			Amount:             loan.Amount,
			Principal:          loan.Principal,
			Duration:           loan.Duration,
			InterestRate:       loan.InterestRate,
			Status:             loan.Status,
			Reason:             loan.Reason,
			MonthlyPayment:     loan.MonthlyPayment,
			OutstandingBalance: loan.OutstandingBalance,
			CreatedAt:          loan.CreatedAt.Format(time.RFC3339),
		})

		if loan.Status == "Approved" || loan.Status == "Disbursed" {
			totalDue += loan.OutstandingBalance
			monthlyPaymentTotal += loan.MonthlyPayment
		}
	}

	return c.JSON(http.StatusOK, MemberLoansResponse{
		Loans:               loanSummaries,
		TotalDue:            totalDue,
		MonthlyPaymentTotal: monthlyPaymentTotal,
	})
}

// GetManagerLoans godoc
// @Summary Get all loans (manager view)
// @Description Returns requested loans first, then all other loans
// @Tags loans
// @Produce json
// @Security SessionAuth
// @Success 200 {object} ManagerLoansResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/loans/manager [get]
func GetManagerLoans(c echo.Context) error {
	requestedLoans, err := loanRepoHandler.GetByStatus("Requested")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch requested loans"})
	}

	allLoans, err := loanRepoHandler.GetAll()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch all loans"})
	}

	var requestedSummaries []LoanSummary
	var otherSummaries []LoanSummary

	for _, loan := range requestedLoans {
		requestedSummaries = append(requestedSummaries, LoanSummary{
			ID:                 loan.ID,
			Amount:             loan.Amount,
			Principal:          loan.Principal,
			Duration:           loan.Duration,
			InterestRate:       loan.InterestRate,
			Status:             loan.Status,
			Reason:             loan.Reason,
			MonthlyPayment:     loan.MonthlyPayment,
			OutstandingBalance: loan.OutstandingBalance,
			CreatedAt:          loan.CreatedAt.Format(time.RFC3339),
		})
	}

	for _, loan := range allLoans {
		if loan.Status != "Requested" {
			otherSummaries = append(otherSummaries, LoanSummary{
				ID:                 loan.ID,
				Amount:             loan.Amount,
				Principal:          loan.Principal,
				Duration:           loan.Duration,
				InterestRate:       loan.InterestRate,
				Status:             loan.Status,
				Reason:             loan.Reason,
				MonthlyPayment:     loan.MonthlyPayment,
				OutstandingBalance: loan.OutstandingBalance,
				CreatedAt:          loan.CreatedAt.Format(time.RFC3339),
			})
		}
	}

	return c.JSON(http.StatusOK, ManagerLoansResponse{
		RequestedLoans: requestedSummaries,
		OtherLoans:     otherSummaries,
	})
}

// GetLoanByID godoc
// @Summary Get loan details by ID
// @Description Returns detailed information about a specific loan (manager only)
// @Tags loans
// @Produce json
// @Security SessionAuth
// @Param id path int true "Loan ID"
// @Success 200 {object} LoanDetailResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/loans/{id} [get]
func GetLoanByID(c echo.Context) error {
	loanIDStr := c.Param("id")
	loanID, err := strconv.ParseUint(loanIDStr, 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid loan ID"})
	}

	loan, err := loanRepoHandler.GetByID(uint(loanID))
	if err != nil {
		return c.JSON(http.StatusNotFound, ErrorResponse{Error: "Loan not found"})
	}

	response := LoanDetailResponse{
		ID: loan.ID,
		Borrower: BorrowerInfo{
			ID:          loan.Borrower.ID,
			Name:        loan.Borrower.Name,
			PhoneNumber: loan.Borrower.PhoneNumber,
		},
		Amount:             loan.Amount,
		Principal:          loan.Principal,
		Duration:           loan.Duration,
		InterestRate:       loan.InterestRate,
		Status:             loan.Status,
		Reason:             loan.Reason,
		MonthlyPayment:     loan.MonthlyPayment,
		OutstandingBalance: loan.OutstandingBalance,
		CreatedAt:          loan.CreatedAt.Format(time.RFC3339),
	}

	if loan.ApprovedBy != nil {
		response.ApprovedBy = &ManagerInfo{
			ID:   loan.ApprovedBy.ID,
			Name: loan.ApprovedBy.Name,
		}
	}

	return c.JSON(http.StatusOK, response)
}

// UpdateLoanStatus godoc
// @Summary Update loan status (approve/reject)
// @Description Manager approves or rejects a loan. On approval, sets interest rate and monthly payment
// @Tags loans
// @Accept json
// @Produce json
// @Security SessionAuth
// @Param id path int true "Loan ID"
// @Param request body UpdateLoanStatusRequest true "Update Status Request"
// @Success 200 {object} UpdateLoanStatusResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/loans/{id}/update_status [post]
func UpdateLoanStatus(c echo.Context) error {
	user := c.Get("user").(*repos.UserWithSession)

	loanIDStr := c.Param("id")
	loanID, err := strconv.ParseUint(loanIDStr, 10, 32)
	if err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid loan ID"})
	}

	var req UpdateLoanStatusRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request"})
	}

	if req.Status != "Approved" && req.Status != "Rejected" {
		return c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Status must be 'Approved' or 'Rejected'"})
	}

	loan, err := loanRepoHandler.GetByID(uint(loanID))
	if err != nil {
		return c.JSON(http.StatusNotFound, ErrorResponse{Error: "Loan not found"})
	}

	if loan.Status != "Requested" {
		return c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Only requested loans can be approved/rejected"})
	}

	var interestRate float64
	var monthlyPayment int

	if req.Status == "Approved" {
		rate, err := interestRateRepo.GetByDuration(loan.Duration)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Interest rate not found for this duration"})
		}

		interestRate = rate.Rate
		totalAmount := float64(loan.Amount) * (1 + interestRate/100)
		monthlyPayment = int(totalAmount / float64(loan.Duration))
	}

	err = loanRepoHandler.UpdateStatus(uint(loanID), req.Status, user.ID, interestRate, monthlyPayment)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update loan status"})
	}

	message := fmt.Sprintf("Loan %s successfully", req.Status)
	return c.JSON(http.StatusOK, UpdateLoanStatusResponse{
		OK:      true,
		Message: message,
	})
}

// RequestLoan godoc
// @Summary Request a new loan (member)
// @Description Member requests a loan with amount, duration, and reason
// @Tags loans
// @Accept json
// @Produce json
// @Security SessionAuth
// @Param request body RequestLoanRequest true "Loan Request"
// @Success 200 {object} RequestLoanResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/loans/request [post]
func RequestLoan(c echo.Context) error {
	user := c.Get("user").(*repos.UserWithSession)

	var req RequestLoanRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request"})
	}

	loan := &db.Loan{
		BorrowerID:         user.ID,
		Amount:             req.Amount,
		Principal:          req.Amount,
		Duration:           req.Duration,
		InterestRate:       0,
		Status:             "Requested",
		Reason:             req.Reason,
		MonthlyPayment:     0,
		OutstandingBalance: req.Amount,
	}

	if err := loanRepoHandler.Create(loan); err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create loan request"})
	}

	return c.JSON(http.StatusOK, RequestLoanResponse{
		OK:     true,
		LoanID: loan.ID,
	})
}

// AddLoan godoc
// @Summary Add a new loan directly (manager)
// @Description Manager directly adds a loan with all details
// @Tags loans
// @Accept json
// @Produce json
// @Security SessionAuth
// @Param request body AddLoanRequest true "Add Loan Request"
// @Success 200 {object} RequestLoanResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/loans/add [post]
func AddLoan(c echo.Context) error {
	user := c.Get("user").(*repos.UserWithSession)

	var req AddLoanRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request"})
	}

	status := req.Status
	if status == "" {
		status = "Approved"
	}

	totalAmount := float64(req.Amount) * (1 + req.InterestRate/100)
	monthlyPayment := int(totalAmount / float64(req.Duration))

	approvedByID := user.ID
	loan := &db.Loan{
		BorrowerID:         req.BorrowerID,
		ApprovedByID:       &approvedByID,
		Amount:             req.Amount,
		Principal:          req.Amount,
		Duration:           req.Duration,
		InterestRate:       req.InterestRate,
		Status:             status,
		Reason:             req.Reason,
		MonthlyPayment:     monthlyPayment,
		OutstandingBalance: req.Amount,
	}

	if err := loanRepoHandler.Create(loan); err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create loan"})
	}

	return c.JSON(http.StatusOK, RequestLoanResponse{
		OK:     true,
		LoanID: loan.ID,
	})
}

// AddDeposit godoc
// @Summary Add a deposit (manager)
// @Description Manager adds a deposit, creates transaction & block, updates user savings balance
// @Tags deposits
// @Accept json
// @Produce json
// @Security SessionAuth
// @Param request body AddDepositRequest true "Add Deposit Request"
// @Success 200 {object} AddDepositResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/deposit [post]
func AddDeposit(c echo.Context) error {
	var req AddDepositRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request"})
	}

	transactionID := transactionGenerator()

	deposit := &db.Deposit{
		TransactionID: transactionID,
		UserID:        req.UserID,
		Amount:        req.Amount,
		Status:        "completed",
		Reference:     req.Reference,
	}

	if err := depositRepoHandler.Create(deposit); err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create deposit"})
	}

	transaction := &db.Transaction{
		TransactionID: transactionID,
		Type:          "deposit",
		FromAccount:   "BANK",
		ToAccount:     fmt.Sprintf("USER-%d", req.UserID),
		Amount:        req.Amount,
		Status:        "completed",
		Description:   fmt.Sprintf("Deposit: %s", req.Reference),
	}

	if err := db.DB.Create(transaction).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create transaction"})
	}

	if _, err := db.CreateBlockForTransaction(transactionID); err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create blockchain entry"})
	}

	if err := depositRepoHandler.UpdateUserBalance(req.UserID, req.Amount); err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to update user balance"})
	}

	return c.JSON(http.StatusOK, AddDepositResponse{
		OK:            true,
		TransactionID: transactionID,
	})
}

// GetInterestRates godoc
// @Summary Get all interest rates
// @Description Returns list of all interest rates by duration
// @Tags interest-rates
// @Produce json
// @Success 200 {object} InterestRateResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/interest_rates [get]
func GetInterestRates(c echo.Context) error {
	rates, err := interestRateRepo.GetAll()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch interest rates"})
	}

	var items []InterestRateItem
	for _, rate := range rates {
		items = append(items, InterestRateItem{
			DurationMonths: rate.DurationMonths,
			Rate:           rate.Rate,
			EffectiveFrom:  time.Unix(rate.EffectiveFrom, 0).Format(time.RFC3339),
		})
	}

	return c.JSON(http.StatusOK, InterestRateResponse{Rates: items})
}

// SetInterestRate godoc
// @Summary Set interest rate for duration (manager)
// @Description Manager sets or updates interest rate for a specific loan duration
// @Tags interest-rates
// @Accept json
// @Produce json
// @Security SessionAuth
// @Param request body SetInterestRateRequest true "Set Interest Rate Request"
// @Success 200 {object} map[string]bool
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/interest_rates/set [post]
func SetInterestRate(c echo.Context) error {
	var req SetInterestRateRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid request"})
	}

	rate := &db.InterestRate{
		DurationMonths: req.DurationMonths,
		Rate:           req.Rate,
		EffectiveFrom:  time.Now().Unix(),
	}

	if err := interestRateRepo.Upsert(rate); err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to set interest rate"})
	}

	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}

func generateTransactionID() string {
	return fmt.Sprintf("TXN-%d", time.Now().UnixNano())
}
