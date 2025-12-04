package db

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() error {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return fmt.Errorf("DATABASE_URL environment variable is not set")
	}

	var dialector gorm.Dialector
	if strings.HasPrefix(dbURL, "sqlite://") {
		sqlitePath := strings.TrimPrefix(dbURL, "sqlite://")
		if dir := filepath.Dir(sqlitePath); dir != "" && dir != "." {
			if err := os.MkdirAll(dir, 0755); err != nil {
				return fmt.Errorf("failed to create database directory: %w", err)
			}
		}
		dialector = sqlite.Open(sqlitePath)
	} else if strings.HasPrefix(dbURL, "postgres://") || strings.HasPrefix(dbURL, "postgresql://") {
		dialector = postgres.Open(dbURL)
	} else {
		return fmt.Errorf("unsupported database URL format")
	}

	var err error
	DB, err = gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("error opening database: %w", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("error getting underlying DB: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	if err = sqlDB.Ping(); err != nil {
		return fmt.Errorf("error connecting to database: %w", err)
	}

	log.Println("Database connection established")

	if err = Migrate(); err != nil {
		return fmt.Errorf("error running migrations: %w", err)
	}

	return nil
}

type User struct {
	gorm.Model
	PhoneNumber    string `gorm:"uniqueIndex;not null"`
	Name           string `gorm:"not null"`
	Email          string `gorm:"index"`
	Role           string `gorm:"type:varchar(20);default:'member';not null;index"`
	SavingsBalance int    `gorm:"default:0;not null"`
	SharesBalance  int    `gorm:"default:0;not null"`
	IsActive       bool   `gorm:"default:true;not null"`
	Otps           []UserOtp
	BorrowedLoans  []Loan `gorm:"foreignKey:BorrowerID"`
	Deposits       []Deposit
}

type UserOtp struct {
	gorm.Model
	UserID     uint   `gorm:"not null;index"`
	User       User   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	OtpCode    string `gorm:"not null"`
	ExpiresAt  int64  `gorm:"not null"`
	IsVerified bool   `gorm:"default:false;not null"`
}

type Transaction struct {
	gorm.Model
	TransactionID string `gorm:"uniqueIndex;not null"`
	Type          string `gorm:"type:varchar(50);not null;index"`
	FromAccount   string `gorm:"not null;index"`
	ToAccount     string `gorm:"not null;index"`
	Amount        int    `gorm:"not null"`
	Status        string `gorm:"type:varchar(50);default:'pending';not null;index"`
	Description   string `gorm:"type:text"`
	Loans         []Loan `gorm:"many2many:transaction_loans;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}

type Loan struct {
	gorm.Model
	BorrowerID         uint    `gorm:"not null;index"`
	Borrower           User    `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
	ApprovedByID       *uint   `gorm:"index"`
	ApprovedBy         *User   `gorm:"foreignKey:ApprovedByID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL"`
	Amount             int     `gorm:"not null"`
	Principal          int     `gorm:"not null"`
	Duration           int     `gorm:"not null"`
	InterestRate       float64 `gorm:"type:decimal(5,2);not null"`
	Status             string  `gorm:"type:varchar(50);default:'Requested';not null;index"`
	Reason             string  `gorm:"type:text"`
	DisbursedAt        *int64
	PaidOffAt          *int64
	MonthlyPayment     int           `gorm:"default:0"`
	OutstandingBalance int           `gorm:"default:0"`
	Transactions       []Transaction `gorm:"many2many:transaction_loans;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	Payments           []LoanPayment `gorm:"foreignKey:LoanID"`
}

type LoanPayment struct {
	gorm.Model
	LoanID          uint   `gorm:"not null;index"`
	Loan            Loan   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
	TransactionID   string `gorm:"not null;index"`
	Amount          int    `gorm:"not null"`
	PrincipalAmount int    `gorm:"not null"`
	InterestAmount  int    `gorm:"not null"`
	BalanceAfter    int    `gorm:"not null"`
	Status          string `gorm:"type:varchar(50);default:'completed';not null"`
	PaymentDate     int64  `gorm:"not null;index"`
}

type Deposit struct {
	gorm.Model
	TransactionID string `gorm:"not null;index"`
	UserID        uint   `gorm:"not null;index"`
	User          User   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
	Amount        int    `gorm:"not null"`
	Status        string `gorm:"type:varchar(50);default:'pending';not null;index"`
	Reference     string `gorm:"index"`
}

type InterestRate struct {
	gorm.Model
	DurationMonths int     `gorm:"uniqueIndex;not null"`
	Rate           float64 `gorm:"type:decimal(5,2);not null"`
	EffectiveFrom  int64   `gorm:"not null"`
}

type Block struct {
	gorm.Model
	BlockNumber     uint   `gorm:"uniqueIndex;not null"`
	PreviousHash    string `gorm:"type:varchar(64);not null"`
	TransactionID   string `gorm:"uniqueIndex;not null"`
	TransactionHash string `gorm:"type:varchar(64);not null"`
	BlockHash       string `gorm:"type:varchar(64);uniqueIndex;not null"`
	Timestamp       int64  `gorm:"not null;index"`
	Nonce           uint64 `gorm:"default:0"`
}

type Session struct {
	gorm.Model
	SessionID string `gorm:"uniqueIndex;not null"`
	UserID    uint   `gorm:"not null;index"`
	User      User   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	ExpiresAt int64  `gorm:"not null;index"`
	IPAddress string
	UserAgent string
}

func Migrate() error {
	log.Println("Running database migrations...")

	err := DB.AutoMigrate(
		&User{},
		&UserOtp{},
		&Transaction{},
		&Loan{},
		&LoanPayment{},
		&Deposit{},
		&InterestRate{},
		&Block{},
		&Session{},
	)
	if err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}

	log.Println("Database migrations completed successfully")

	if err := InitializeBlockchain(); err != nil {
		return fmt.Errorf("blockchain initialization failed: %w", err)
	}

	return nil
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}
