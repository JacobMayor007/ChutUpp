package repository

import (
	"database/sql"
	database "websocket_server/config"
	"websocket_server/model"
)

type MessageInterface interface {
	MessageHistory(user_id, receiver_id, cursor string) ([]model.AllMessages, error)
}

type MessageDatabase struct {
	sqlDb *database.PostgreDB
}

func MessageDatabaseInit(db *database.PostgreDB) *MessageDatabase {
	return &MessageDatabase{
		sqlDb: db,
	}
}
func (md *MessageDatabase) MessageHistory(user_id, receiver_id, cursor string) ([]model.AllMessages, error) {
	// Base query using your chat_participants logic
	sqlStatement := `
        SELECT message_id, user_id, content, created_at, updated_at
        FROM messages 
        WHERE chat_id = (
            SELECT chat_id FROM chat_participants 
            WHERE user_id IN ($1, $2)
            GROUP BY chat_id HAVING COUNT(DISTINCT user_id) = 2
            LIMIT 1
        )
    `

	var rows *sql.Rows
	var err error

	if cursor != "" {
		// Fetch older messages
		sqlStatement += ` AND created_at < $3 ORDER BY created_at DESC LIMIT 20`
		rows, err = md.sqlDb.Db.Query(sqlStatement, user_id, receiver_id, cursor)
	} else {
		// Initial load: Get the 20 most recent messages
		sqlStatement += ` ORDER BY created_at DESC LIMIT 20`
		rows, err = md.sqlDb.Db.Query(sqlStatement, user_id, receiver_id)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []model.AllMessages
	// ... rest of your scanning logic ...

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

	// IMPORTANT: Because we use DESC to get the latest 20,
	// you might want to reverse the slice before returning
	// so it's ASC (chronological) for the frontend.
	return reverseMessages(messages), nil
}

func reverseMessages(s []model.AllMessages) []model.AllMessages {
	for i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {
		s[i], s[j] = s[j], s[i]
	}
	return s
}
