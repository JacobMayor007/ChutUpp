package routes

import (
	"websocket_server/api"
	"websocket_server/repository"

	"github.com/gofiber/fiber/v2"
)

func ChatRoutes(app *fiber.App, chat repository.ChatRepository) {
	chatApi := api.ChatApi{
		ChatRepository: chat,
	}

	app.Post("/chat", chatApi.GetChatApi)
}
