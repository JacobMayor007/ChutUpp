package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"
	database "websocket_server/config"
	"websocket_server/repository"
	"websocket_server/routes"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

var UserRepository *repository.UserDB
var shutdownOnce sync.Once
var shutdownComplete chan bool

func init() {
	shutdownComplete = make(chan bool)
}

func main() {
	fmt.Printf("Main Server")

	server := fiber.New()

	//Configuring the CORS policy of the backend
	server.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Accept, Content-Type, Origins",
		AllowMethods: strings.Join([]string{
			fiber.MethodGet,
			fiber.MethodPost,
			fiber.MethodHead,
			fiber.MethodPut,
			fiber.MethodDelete,
			fiber.MethodPatch,
		}, ","),
	}))

	// Load .env file if it exists (optional for deployed environments)
	godotenv.Load()

	db, err := database.NewPostgreDB()
	if err != nil {
		log.Fatal(err)
	}

	if err := db.Init(); err != nil {
		log.Fatal(err)
	}

	userRepository := repository.InitUserRepository(db)
	chatRepository := repository.InitChatRepository(db)
	messRepository := repository.MessageDatabaseInit(db)
	routes.SetupRoutes(server, userRepository, chatRepository)

	st := NewStation(chatRepository, messRepository, userRepository)
	go st.Run()

	// Setup graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go handleGracefulShutdown(sigChan, server, st, db)

	server.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	server.Get("/ws", websocket.New(func(c *websocket.Conn) {
		userIDStr := c.Query("userId")
		if userIDStr == "" {
			log.Println("No userId provided")
			return
		}

		if err := userRepository.IsIdExist(userIDStr); err != nil {
			log.Printf("ID Not Found: %s", userIDStr)

			// SEND ERROR TO CLIENT BEFORE RETURNING
			c.WriteJSON(map[string]string{
				"type":    "error",
				"content": "User ID does not exist in database",
			})

			// Properly close the socket so React knows why
			msg := websocket.FormatCloseMessage(websocket.ClosePolicyViolation, "User not authorized")
			c.WriteControl(websocket.CloseMessage, msg, time.Now().Add(time.Second))
			return
		}

		log.Println("Id successful")

		user := &User{
			UserId:  userIDStr,
			Station: st,
			Conn:    c,
			Send:    make(chan Content, 256),
		}

		user.Station.Register <- user
		go user.WriteInjection()
		user.ReadInjection()
	}))

	log.Fatal(server.Listen(":8080"))
}

func handleGracefulShutdown(sigChan chan os.Signal, server *fiber.App, st *Station, db *database.PostgreDB) {
	<-sigChan // Wait for shutdown signal

	shutdownOnce.Do(func() {
		log.Println("🛑 Graceful shutdown initiated...")

		// Step 1: Close all WebSocket connections
		log.Println("📴 Closing all WebSocket connections...")
		st.Shutdown()

		// Step 2: Wait a bit for connections to close
		time.Sleep(1 * time.Second)

		// Step 3: Close database connection
		log.Println("🗄️  Closing database connection...")
		if err := db.Db.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}

		// Step 4: Shutdown the Fiber server
		log.Println("🚪 Shutting down HTTP server...")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := server.ShutdownWithContext(ctx); err != nil {
			log.Printf("Error shutting down server: %v", err)
		}

		log.Println("✅ Server shutdown complete")
		shutdownComplete <- true
	})
}
