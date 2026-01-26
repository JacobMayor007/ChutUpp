package model

import "time"

type User struct {
	UserUID string `json:"user_id"`
	Email   string `json:"email"`
}

type Messages struct {
	Type       string `json:"type"`
	Message    string `json:"content"`
	ClientID   string `json:"user_id"`
	ReceiverID string `json:"receiver_id"`
}

type Chats struct {
	RoomID      string    `json:"chat_id"`
	LastMessage string    `json:"last_message"`
	UserIds     [2]string `json:"participants"`
}

type ChatSummary struct {
	ChatID          string    `json:"chat_id"`
	LastMessage     string    `json:"last_message"`
	LastSenderEmail string    `json:"last_sender_email"`
	LastSenderId    string    `json:"last_sender_id"`
	RecipientEmail  string    `json:"other_user_id"`
	RecipientId     string    `json:"other_user_email"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type AllMessages struct {
	MessageID   string    `json:"message_id"`
	Content     string    `json:"content"`
	CurrentUser string    `json:"current_user"`
	OtherUser   string    `json:"other_user"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
