package main

import (
	"fmt"
	"log"
	"strings"
	database "websocket_server/config"
	"websocket_server/repository"
	"websocket_server/routes"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

var UserRepository *repository.UserDB

func main() {
	fmt.Printf("Main Server")

	server := fiber.New()

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
	chatRepository := repository.InitChatRepository(db)
	routes.SetupRoutes(server, userRepository)

	st := NewStation(chatRepository)
	go st.Run()
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
			log.Println("error on id")
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
<<<<<<< HEAD
=======

	fmt.Println(st.GetOnlineUsers())
>>>>>>> 36d353e870a3a92512049044059065c65fef7165

	log.Fatal(server.Listen(":8080"))
}
