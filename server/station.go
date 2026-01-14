package main

import (
	"encoding/json"
	"log"
	"sync"
	"time"
	"websocket_server/repository"
)

type Content struct {
	Type       string    `json:"type"`
	Message    string    `json:"content"`
	ClientID   string    `json:"user_id"`
	ReceiverID string    `json:"receiver_id"`
	CreatedAt  time.Time `json:"created_at"`
}

type Station struct {
	mx         sync.RWMutex
	Users      map[string]*User
	Broadcast  chan Content
	Register   chan *User
	UnRegister chan *User
	Repo       repository.ChatRepository
}

func NewStation(repo repository.ChatRepository) *Station {
	return &Station{
		Broadcast:  make(chan Content),
		Register:   make(chan *User),
		UnRegister: make(chan *User),
		Users:      make(map[string]*User),
		Repo:       repo,
	}
}

func (s *Station) Run() {
	for {
		select {
		// 1. REGISTER USER
		case user := <-s.Register:
			s.mx.Lock()
			s.Users[user.UserId] = user
			s.mx.Unlock()
			log.Printf("User Joined: %s", user.UserId)

		// 2. UNREGISTER USER
		case user := <-s.UnRegister:
			s.mx.Lock()
			if _, ok := s.Users[user.UserId]; ok {
				delete(s.Users, user.UserId)
				close(user.Send)
				log.Printf("User Left: %s", user.UserId)
			}
			s.mx.Unlock()

		// 3. HANDLE MESSAGES
		case msg := <-s.Broadcast:
			msg.CreatedAt = time.Now()

			// LOGGING
			log.Printf("Type: %s", msg.Type)
			log.Printf("Sender Id: %s", msg.ClientID)
			log.Printf("Receiver Id: %s", msg.ReceiverID)

			// --- HANDLE DIFFERENT MESSAGE TYPES ---
			switch msg.Type {

			// A. REAL-TIME CHAT MESSAGE
			case "message":
				// Save to DB
				if _, err := s.Repo.SetChats(msg.ClientID, msg.ReceiverID, msg.Message); err != nil {
					log.Printf("Error saving message: %s", err)
					continue
				}

				// Find Receiver and Send
				s.mx.RLock()
				receiver, ok := s.Users[msg.ReceiverID]
				s.mx.RUnlock()

				if ok {
					select {
					case receiver.Send <- msg:
						log.Printf("Message routed from %s to %s", msg.ClientID, msg.ReceiverID)
					default:
						close(receiver.Send)
						s.mx.Lock()
						delete(s.Users, msg.ReceiverID)
						s.mx.Unlock()
					}
				} else {
					log.Printf("Message failed: Recipient %s is offline", msg.ReceiverID)
				}

			case "typing":
				s.mx.RLock()
				receiver, ok := s.Users[msg.ReceiverID]
				s.mx.RUnlock()

				if ok {
					select {
					case receiver.Send <- msg:
						log.Printf("Message routed from %s to %s", msg.ClientID, msg.ReceiverID)
					default:
						close(receiver.Send)
						s.mx.Lock()
						delete(s.Users, msg.ReceiverID)
						s.mx.Unlock()
					}
				} else {
					log.Printf("Message failed: Recipient %s is offline", msg.ReceiverID)
				}
			case "chat":
				// 1. Fetch from DB
				chats, err := s.Repo.GetChats(msg.ClientID)
				if err != nil {
					log.Printf("Error fetching history: %s", err)
					continue
				}

				// 2. Marshal data to JSON string
				// We convert the complex 'chats' object into a string so it fits in the 'Message' field
				historyJSON, err := json.Marshal(chats)
				if err != nil {
					log.Printf("Error marshalling history: %s", err)
					continue
				}

				// 3. Construct response for the REQUESTER
				response := Content{
					Type:       "history",           // Use a distinct type so frontend knows to parse it
					Message:    string(historyJSON), // The actual data
					ClientID:   "server",
					ReceiverID: msg.ClientID,
					CreatedAt:  time.Now(),
				}

				// 4. Send back to the SENDER (The person who asked for history)
				s.mx.RLock()
				requester, ok := s.Users[msg.ClientID]
				s.mx.RUnlock()

				if ok {
					requester.Send <- response
					log.Printf("Sent chat history to %s", msg.ClientID)
				}
			}
		}
	}
}
