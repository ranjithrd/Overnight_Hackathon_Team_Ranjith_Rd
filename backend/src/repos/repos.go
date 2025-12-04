package repos

import (
	"backend/src/db"
	"fmt"
	"time"
)

type User struct{}

func (User) FindByPhoneNumber(phoneNumber string) (*db.User, error) {
	var user db.User
	err := db.DB.Where("phone_number = ?", phoneNumber).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (User) Create(phoneNumber, name string) (*db.User, error) {
	user := &db.User{
		PhoneNumber: phoneNumber,
		Name:        name,
		IsActive:    true,
	}
	if err := db.DB.Create(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}

func (User) GetByID(userID uint) (*db.User, error) {
	var user db.User
	err := db.DB.First(&user, userID).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

type OTP struct{}

func (OTP) Create(userID uint, otpCode string, expiresAt int64) (*db.UserOtp, error) {
	otp := &db.UserOtp{
		UserID:     userID,
		OtpCode:    otpCode,
		ExpiresAt:  expiresAt,
		IsVerified: false,
	}
	if err := db.DB.Create(otp).Error; err != nil {
		return nil, err
	}
	return otp, nil
}

func (OTP) FindByID(otpID uint) (*db.UserOtp, error) {
	var otp db.UserOtp
	err := db.DB.First(&otp, otpID).Error
	if err != nil {
		return nil, err
	}
	return &otp, nil
}

func (OTP) Verify(otpID uint, otpCode string) error {
	var otp db.UserOtp
	if err := db.DB.First(&otp, otpID).Error; err != nil {
		return err
	}

	if otp.IsVerified {
		return fmt.Errorf("OTP already verified")
	}

	if otp.ExpiresAt < time.Now().Unix() {
		return fmt.Errorf("OTP expired")
	}

	if otp.OtpCode != otpCode {
		return fmt.Errorf("invalid OTP")
	}

	otp.IsVerified = true
	return db.DB.Save(&otp).Error
}

func (OTP) CountRecentByPhoneNumber(phoneNumber string, sinceMinutes int) (int64, error) {
	var count int64
	since := time.Now().Add(-time.Duration(sinceMinutes) * time.Minute)

	err := db.DB.Model(&db.UserOtp{}).
		Joins("JOIN users ON users.id = user_otps.user_id").
		Where("users.phone_number = ? AND user_otps.created_at > ?", phoneNumber, since).
		Count(&count).Error

	return count, err
}

type SessionRepo struct{}

func (SessionRepo) Create(userID uint, sessionID string, expiresAt int64, ipAddress, userAgent string) (*db.Session, error) {
	session := &db.Session{
		SessionID: sessionID,
		UserID:    userID,
		ExpiresAt: expiresAt,
		IPAddress: ipAddress,
		UserAgent: userAgent,
	}
	if err := db.DB.Create(session).Error; err != nil {
		return nil, err
	}
	return session, nil
}

func (SessionRepo) FindBySessionID(sessionID string) (*db.Session, error) {
	var session db.Session
	err := db.DB.Preload("User").Where("session_id = ? AND expires_at > ?", sessionID, time.Now().Unix()).First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (SessionRepo) Delete(sessionID string) error {
	return db.DB.Where("session_id = ?", sessionID).Delete(&db.Session{}).Error
}

func (SessionRepo) DeleteExpired() error {
	return db.DB.Where("expires_at < ?", time.Now().Unix()).Delete(&db.Session{}).Error
}

func (SessionRepo) DeleteByUserID(userID uint) error {
	return db.DB.Where("user_id = ?", userID).Delete(&db.Session{}).Error
}

type UserWithSession struct {
	ID             uint
	PhoneNumber    string
	Name           string
	Email          string
	Role           string
	SavingsBalance int
	SharesBalance  int
	IsActive       bool
}

type LoanRepo struct{}

func (LoanRepo) Create(loan *db.Loan) error {
	return db.DB.Create(loan).Error
}

func (LoanRepo) GetByID(loanID uint) (*db.Loan, error) {
	var loan db.Loan
	err := db.DB.Preload("Borrower").Preload("ApprovedBy").First(&loan, loanID).Error
	if err != nil {
		return nil, err
	}
	return &loan, nil
}

func (LoanRepo) GetByBorrowerID(borrowerID uint) ([]db.Loan, error) {
	var loans []db.Loan
	err := db.DB.Where("borrower_id = ?", borrowerID).Preload("Payments").Find(&loans).Error
	return loans, err
}

func (LoanRepo) GetByStatus(status string) ([]db.Loan, error) {
	var loans []db.Loan
	err := db.DB.Where("status = ?", status).Preload("Borrower").Preload("ApprovedBy").Find(&loans).Error
	return loans, err
}

func (LoanRepo) GetAll() ([]db.Loan, error) {
	var loans []db.Loan
	err := db.DB.Preload("Borrower").Preload("ApprovedBy").Find(&loans).Error
	return loans, err
}

func (LoanRepo) UpdateStatus(loanID uint, status string, approvedByID uint, interestRate float64, monthlyPayment int) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if status == "Approved" {
		updates["approved_by_id"] = approvedByID
		updates["interest_rate"] = interestRate
		updates["monthly_payment"] = monthlyPayment
	}
	return db.DB.Model(&db.Loan{}).Where("id = ?", loanID).Updates(updates).Error
}

func (LoanRepo) GetTotalLoansAmount() (int64, error) {
	var total int64
	err := db.DB.Model(&db.Loan{}).Select("COALESCE(SUM(amount), 0)").Where("status IN ?", []string{"Approved", "Disbursed"}).Scan(&total).Error
	return total, err
}

func (LoanRepo) GetTotalProfit() (int64, error) {
	var totalInterest int64
	err := db.DB.Model(&db.LoanPayment{}).Select("COALESCE(SUM(interest_amount), 0)").Scan(&totalInterest).Error
	return totalInterest, err
}

type DepositRepo struct{}

func (DepositRepo) Create(deposit *db.Deposit) error {
	return db.DB.Create(deposit).Error
}

func (DepositRepo) UpdateUserBalance(userID uint, amount int) error {
	return db.DB.Model(&db.User{}).Where("id = ?", userID).UpdateColumn("savings_balance", db.DB.Raw("savings_balance + ?", amount)).Error
}

type InterestRateRepo struct{}

func (InterestRateRepo) Create(rate *db.InterestRate) error {
	return db.DB.Create(rate).Error
}

func (InterestRateRepo) GetAll() ([]db.InterestRate, error) {
	var rates []db.InterestRate
	err := db.DB.Order("duration_months ASC").Find(&rates).Error
	return rates, err
}

func (InterestRateRepo) GetByDuration(durationMonths int) (*db.InterestRate, error) {
	var rate db.InterestRate
	err := db.DB.Where("duration_months = ?", durationMonths).Order("effective_from DESC").First(&rate).Error
	if err != nil {
		return nil, err
	}
	return &rate, nil
}

func (InterestRateRepo) Upsert(rate *db.InterestRate) error {
	var existing db.InterestRate
	err := db.DB.Where("duration_months = ?", rate.DurationMonths).First(&existing).Error
	if err != nil {
		return db.DB.Create(rate).Error
	}
	return db.DB.Model(&existing).Updates(rate).Error
}

type StatsRepo struct{}

func (StatsRepo) GetTotalAssets() (int64, error) {
	var total int64
	err := db.DB.Model(&db.User{}).Select("COALESCE(SUM(savings_balance + shares_balance), 0)").Scan(&total).Error
	return total, err
}

func (StatsRepo) GetTotalSharesBalance() (int64, error) {
	var total int64
	err := db.DB.Model(&db.User{}).Select("COALESCE(SUM(shares_balance), 0)").Scan(&total).Error
	return total, err
}

func (StatsRepo) GetMemberCount() (int64, error) {
	var count int64
	err := db.DB.Model(&db.User{}).Where("role = ?", "member").Count(&count).Error
	return count, err
}
