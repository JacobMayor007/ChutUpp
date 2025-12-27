package main

import (
	"fmt"
	"log"
	"strings"
	database "websocket_server/config"
	"websocket_server/repository"
	"websocket_server/routes"

	"github.com/gofiber/contrib/websocket" // NEW IMPORT
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	fmt.Printf("Main Server")

	server := fiber.New()
	hub := NewHub()
	go hub.Run()

	// --- FIX STARTS HERE ---

	// 1. WebSocket Middleware to ensure the connection is actually an upgrade request
	server.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	// 2. The WebSocket Route (Replacing http.HandleFunc)
	server.Get("/ws", websocket.New(func(c *websocket.Conn) {
		// Get userId from Query Params (e.g., ?userId=123)
		userIDStr := c.Query("userId")
		if userIDStr == "" {
			log.Println("No userId provided")
			return
		}

		// Create the client using the Fiber connection 'c'
		client := &Client{
			UserID: userIDStr,
			Hub:    hub,
			Conn:   c,
			Send:   make(chan Message, 256),
		}

		// Register
		client.Hub.Register <- client

		// Start Pumps
		// We run WritePump in a goroutine, but ReadPump in the main thread
		// This keeps the connection open until ReadPump exits.
		go client.WritePump()
		client.ReadPump()
	}))

	// --- FIX ENDS HERE ---

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

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error on loading env data")
	}

	db, err := database.NewPostgreDB()
	if err != nil {
		log.Fatal(err)
	}

	if err := db.Init(); err != nil {
		log.Fatal(err)
	}

	userRepository := repository.InitUserRepository(db)
	routes.SetupRoutes(server, userRepository)

	fmt.Println(hub.GetOnlineUsers())

	log.Fatal(server.Listen(":8080"))
}
