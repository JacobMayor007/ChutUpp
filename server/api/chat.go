package api

import (
	"fmt"
	"websocket_server/repository"

	"github.com/gofiber/fiber/v2"
)

type ChatApi struct {
	ChatRepository repository.ChatRepository
}

func (ca *ChatApi) GetChatApi(f *fiber.Ctx) error {
	var body struct {
		UserId string `json:"user_id"`
	}

	if err := f.BodyParser(&body); err != nil {
		fmt.Printf("Error in getting chat data")

		return err
	}

	result, err := ca.ChatRepository.GetChats(body.UserId)

	if err != nil {
		fmt.Printf("There is an error in getting chat data")
		return err
	}

	return f.Status(200).JSON(result)
}
