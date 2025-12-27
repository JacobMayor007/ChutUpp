package main

import (
	"log"
	"sync"
)

type Message struct {
	SenderID    string `json:"sender_id"`
	RecipientID string `json:"recipient_id"`
	Content     string `json:"content"`
}

type Hub struct {
	// Mutex to protect the Clients map from concurrent access
	// (Prevents crashes if you check "who is online" while users are connecting)
	mu sync.RWMutex

	Clients    map[string]*Client
	Broadcast  chan Message
	Register   chan *Client
	Unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan Message),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Clients:    make(map[string]*Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client.UserID] = client
			h.mu.Unlock()
			// PRINT WHEN SOMEONE JOINS
			log.Printf("User Joined: %s | Total Online: %d", client.UserID, len(h.GetOnlineUsers()))

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client.UserID]; ok {
				delete(h.Clients, client.UserID)
				close(client.Send)
				// PRINT WHEN SOMEONE LEAVES
				log.Printf("User Left: %s | Total Online: %d", client.UserID, len(h.Clients))
			}
			h.mu.Unlock()

		case msg := <-h.Broadcast:
			h.mu.RLock()
			recipient, ok := h.Clients[msg.RecipientID]
			h.mu.RUnlock()

			if ok {
				select {
				case recipient.Send <- msg:
					log.Printf("Message routed from %s to %s", msg.SenderID, msg.RecipientID)
				default:
					close(recipient.Send)
					h.mu.Lock()
					delete(h.Clients, msg.RecipientID)
					h.mu.Unlock()
				}
			} else {
				log.Printf("Message failed: Recipient %s is offline", msg.RecipientID)
			}
		}
	}
}

func (h *Hub) GetOnlineUsers() []string {
	h.mu.RLock()
	defer h.mu.RUnlock()

	var users []string
	for userID := range h.Clients {
		users = append(users, userID)
	}
	return users
}
