package routes

import (
	"websocket_server/repository"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, user repository.UserRepository, chat repository.ChatRepository) {
	UserRoutes(app, user)
	ChatRoutes(app, chat)
}
