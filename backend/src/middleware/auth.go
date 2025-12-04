package middleware

import (
	"backend/src/repos"
	"net/http"

	"github.com/labstack/echo/v4"
)

var sessionRepo = repos.SessionRepo{}

func Auth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		cookie, err := c.Cookie("session_id")
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		}

		session, err := sessionRepo.FindBySessionID(cookie.Value)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid session"})
		}

		userWithSession := &repos.UserWithSession{
			ID:             session.User.ID,
			PhoneNumber:    session.User.PhoneNumber,
			Name:           session.User.Name,
			Email:          session.User.Email,
			Role:           session.User.Role,
			SavingsBalance: session.User.SavingsBalance,
			SharesBalance:  session.User.SharesBalance,
			IsActive:       session.User.IsActive,
		}

		c.Set("user", userWithSession)
		return next(c)
	}
}

func RequireRole(roles ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			user, ok := c.Get("user").(*repos.UserWithSession)
			if !ok {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
			}

			for _, role := range roles {
				if user.Role == role {
					return next(c)
				}
			}

			return c.JSON(http.StatusForbidden, map[string]string{"error": "Insufficient permissions"})
		}
	}
}

func RequireManager(next echo.HandlerFunc) echo.HandlerFunc {
	return RequireRole("manager")(next)
}

func RequireMember(next echo.HandlerFunc) echo.HandlerFunc {
	return RequireRole("member")(next)
}

func RequireAuditor(next echo.HandlerFunc) echo.HandlerFunc {
	return RequireRole("auditor")(next)
}
