package handlers

import (
	"backend/src/repos"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math/big"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

const (
	OTPExpiryMinutes    = 5
	OTPRateLimit        = 8
	OTPRateLimitMinutes = 1
	SessionExpiryHours  = 24 * 7
)

var (
	userRepo    = repos.User{}
	otpRepo     = repos.OTP{}
	sessionRepo = repos.SessionRepo{}
	smsService  *repos.SMS
)

func InitAuthHandlers() {
	smsService = repos.NewSMS()
}

type LoginRequest struct {
	PhoneNumber string `json:"phone_number" validate:"required" example:"+1234567890"`
	Password    string `json:"password" validate:"required" example:"password123"`
}

type LoginResponse struct {
	OK bool `json:"ok" example:"true"`
}

type ErrorResponse struct {
	Error string `json:"error" example:"Invalid request"`
}

// Login godoc
// @Summary Login with phone and password
// @Description Authenticate with phone number and password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login Request"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/auth/login [post]
func Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	user, err := userRepo.FindByPhoneNumber(req.PhoneNumber)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid credentials"})
	}

	if user.Password == "" {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Password not set"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid credentials"})
	}

	sessionID := generateSessionID()
	expiresAt := time.Now().Add(SessionExpiryHours * time.Hour).Unix()
	ipAddress := c.RealIP()
	userAgent := c.Request().UserAgent()

	session, err := sessionRepo.Create(user.ID, sessionID, expiresAt, ipAddress, userAgent)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create session"})
	}

	cookie := &http.Cookie{
		Name:     "session_id",
		Value:    session.SessionID,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		MaxAge:   int(SessionExpiryHours * 3600),
		SameSite: http.SameSiteLaxMode,
	}
	c.SetCookie(cookie)

	return c.JSON(http.StatusOK, LoginResponse{OK: true})
}

// Logout godoc
// @Summary Logout
// @Description Logout and invalidate session
// @Tags auth
// @Produce json
// @Success 200 {object} LoginResponse
// @Failure 401 {object} ErrorResponse
// @Security SessionAuth
// @Router /api/v1/auth/logout [post]
func Logout(c echo.Context) error {
	cookie, err := c.Cookie("session_id")
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Not logged in"})
	}

	if err := sessionRepo.Delete(cookie.Value); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to logout"})
	}

	// Clear the cookie
	c.SetCookie(&http.Cookie{
		Name:     "session_id",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		MaxAge:   -1,
		SameSite: http.SameSiteLaxMode,
	})

	return c.JSON(http.StatusOK, LoginResponse{OK: true})
}

type VerifyRequest struct {
	PhoneNumber string `json:"phone_number" validate:"required" example:"+1234567890"`
	RequestID   uint   `json:"request_id" validate:"required" example:"123"`
	OTP         string `json:"otp" validate:"required" example:"123456"`
}

type VerifyResponse struct {
	OK      bool   `json:"ok" example:"true"`
	Session string `json:"session,omitempty" example:"abc123def456..."`
}

// Verify godoc
// @Summary Verify OTP and create session
// @Description Verify the OTP code and create an authenticated session
// @Tags auth
// @Accept json
// @Produce json
// @Param request body VerifyRequest true "Verify Request"
// @Success 200 {object} VerifyResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} VerifyResponse "Invalid OTP or expired"
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/auth/verify [post]
func Verify(c echo.Context) error {
	var req VerifyRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	user, err := userRepo.FindByPhoneNumber(req.PhoneNumber)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, VerifyResponse{OK: false})
	}

	if err := otpRepo.Verify(req.RequestID, req.OTP); err != nil {
		return c.JSON(http.StatusUnauthorized, VerifyResponse{OK: false})
	}

	sessionID := generateSessionID()
	expiresAt := time.Now().Add(SessionExpiryHours * time.Hour).Unix()
	ipAddress := c.RealIP()
	userAgent := c.Request().UserAgent()

	session, err := sessionRepo.Create(user.ID, sessionID, expiresAt, ipAddress, userAgent)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create session"})
	}

	cookie := &http.Cookie{
		Name:     "session_id",
		Value:    session.SessionID,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Unix(expiresAt, 0),
	}
	c.SetCookie(cookie)

	return c.JSON(http.StatusOK, VerifyResponse{OK: true, Session: sessionID})
}

type MeResponse struct {
	ID             uint   `json:"id" example:"1"`
	PhoneNumber    string `json:"phone_number" example:"+1234567890"`
	Name           string `json:"name" example:"John Doe"`
	Email          string `json:"email" example:"john@example.com"`
	SavingsBalance int    `json:"savings_balance" example:"5000"`
	SharesBalance  int    `json:"shares_balance" example:"1000"`
	IsActive       bool   `json:"is_active" example:"true"`
	Role           string `json:"role" example:"member"`
}

// Me godoc
// @Summary Get current user information
// @Description Get authenticated user's profile and account information
// @Tags auth
// @Produce json
// @Security SessionAuth
// @Success 200 {object} MeResponse
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Router /api/v1/auth/me [get]
func Me(c echo.Context) error {
	user := c.Get("user")
	if user == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
	}

	u := user.(*repos.UserWithSession)
	return c.JSON(http.StatusOK, MeResponse{
		ID:             u.ID,
		PhoneNumber:    u.PhoneNumber,
		Name:           u.Name,
		Email:          u.Email,
		SavingsBalance: u.SavingsBalance,
		SharesBalance:  u.SharesBalance,
		IsActive:       u.IsActive,
		Role:           u.Role,
	})
}

func generateOTP() string {
	n, _ := rand.Int(rand.Reader, big.NewInt(1000000))
	return fmt.Sprintf("%06d", n.Int64())
}

func generateSessionID() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
