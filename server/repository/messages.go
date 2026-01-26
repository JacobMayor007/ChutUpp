package repository

import (
	database "websocket_server/config"
	"websocket_server/model"
)

type MessageInterface interface {
	MessageHistory(user_id, receiver_id string) ([]model.AllMessages, error)
}

type MessageDatabase struct {
	sqlDb *database.PostgreDB
}

func MessageDatabaseInit(db *database.PostgreDB) *MessageDatabase {
	return &MessageDatabase{
		sqlDb: db,
	}
}

func (md *MessageDatabase) MessageHistory(user_id, receiver_id string) ([]model.AllMessages, error) {

	sqlStatement := `
        SELECT 
            message_id, 
            user_id, 
            content, 
            created_at, 
            updated_at
        FROM messages 
        WHERE chat_id = (
            SELECT chat_id 
            FROM messages 
            WHERE user_id IN ($1, $2)
            GROUP BY chat_id
            HAVING COUNT(DISTINCT user_id) = 2
            LIMIT 1
        )
        ORDER BY created_at ASC
    `

	rows, err := md.sqlDb.Db.Query(sqlStatement, user_id, receiver_id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []model.AllMessages

	for rows.Next() {
		var msg model.AllMessages

		err := rows.Scan(
			&msg.MessageID,
			&msg.CurrentUser,
			&msg.Content,
			&msg.CreatedAt,
			&msg.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		if msg.CurrentUser == user_id {
			msg.OtherUser = receiver_id
		} else {
			msg.OtherUser = user_id
		}

		messages = append(messages, msg)
	}

	return messages, nil
}
