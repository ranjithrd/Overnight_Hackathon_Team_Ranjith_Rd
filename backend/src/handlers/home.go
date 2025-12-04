package handlers

import (
	"backend/src/repos"
	"net/http"

	"github.com/labstack/echo/v4"
)

var (
	statsRepo = repos.StatsRepo{}
	loanRepo  = repos.LoanRepo{}
)

type HomeResponse struct {
	TotalAssets      int64  `json:"total_assets" example:"1000000"`
	TotalLoans       int64  `json:"total_loans" example:"500000"`
	TotalProfit      int64  `json:"total_profit" example:"50000"`
	DividendExpected *int64 `json:"dividend_expected,omitempty" example:"5000"`
	Role             string `json:"role" example:"member"`
}

// Home godoc
// @Summary Get home dashboard statistics
// @Description Returns financial statistics based on user role (member, manager, auditor)
// @Tags home
// @Produce json
// @Security SessionAuth
// @Success 200 {object} HomeResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/home [get]
func Home(c echo.Context) error {
	user := c.Get("user").(*repos.UserWithSession)

	totalAssets, err := statsRepo.GetTotalAssets()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get total assets"})
	}

	totalLoans, err := loanRepo.GetTotalLoansAmount()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get total loans"})
	}

	totalProfit, err := loanRepo.GetTotalProfit()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to get total profit"})
	}

	response := HomeResponse{
		TotalAssets: totalAssets,
		TotalLoans:  totalLoans,
		TotalProfit: totalProfit,
		Role:        user.Role,
	}

	if user.Role == "member" {
		totalShares, err := statsRepo.GetTotalSharesBalance()
		if err != nil {
			return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to calculate dividend"})
		}

		if totalShares > 0 {
			dividend := (totalProfit * int64(user.SharesBalance)) / totalShares
			response.DividendExpected = &dividend
		} else {
			zero := int64(0)
			response.DividendExpected = &zero
		}
	}

	return c.JSON(http.StatusOK, response)
}
