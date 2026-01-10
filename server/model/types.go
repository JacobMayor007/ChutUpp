package model

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
	LastMessage string    `json:"lastMessage"`
	UserIds     [2]string `json:"user_id"`
}
