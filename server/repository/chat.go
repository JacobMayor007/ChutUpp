package repository

import (
	database "websocket_server/config"
	"websocket_server/model"
)

type ChatRepository interface {
	SetChats(message *model.Chats) error
}

type ChatDB struct {
	sqlDB *database.PostgreDB
}

func InitChatRepository(db *database.PostgreDB) *ChatDB {
	return &ChatDB{
		sqlDB: db,
	}
}

func (cd *ChatDB) SetChats(message *model.Chats) error {

	return nil
}
