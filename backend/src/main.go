package main

import (
	"backend/src/blockchain"
	"backend/src/db"
	_ "backend/src/docs"
	"backend/src/handlers"
	"backend/src/routes"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	echoSwagger "github.com/swaggo/echo-swagger"
)

// @title 8MH API
// @version 1.0
// @description API for 8MH cooperative banking system with blockchain verification
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@8mh.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /
// @schemes http https

// @securityDefinitions.apikey SessionAuth
// @in cookie
// @name session_id

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	if err := db.InitDB(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Initialize Ethereum client (optional - continues without Sepolia if not configured)
	if err := blockchain.InitEthereum(); err != nil {
		log.Printf("WARNING: Sepolia integration not available: %v", err)
		log.Println("Continuing with local blockchain only...")
	}

	handlers.InitAuthHandlers()

	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{
			"http://localhost:3000",
			"http://localhost:4000",
			"http://localhost:5173",
			"http://localhost:5173/",
			"http://localhost:5174",
			"http://localhost:5174/",
			"http://localhost:8000",
			"http://localhost:8080",
			"https://8mh-ui.d.p.ranjithrd.in",
		},
		AllowMethods:     []string{echo.GET, echo.POST, echo.PUT, echo.DELETE, echo.PATCH, echo.OPTIONS},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowCredentials: true,
	}))

	e.GET("/swagger/*", echoSwagger.WrapHandler)

	routes.RegisterRoutes(e)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s...", port)
	e.Logger.Fatal(e.Start(":" + port))
}
