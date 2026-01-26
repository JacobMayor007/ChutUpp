package main

import (
	"log"
	"sync"
	"time"
	"websocket_server/repository"
)

type Content struct {
	Type       string    `json:"type"`
	Message    any       `json:"content"` // Now supports string OR ChatSummary slice
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
	ChatRepo   repository.ChatRepository
	MessRepo   repository.MessageInterface
}

func NewStation(repo repository.ChatRepository, mr repository.MessageInterface) *Station {
	return &Station{
		Broadcast:  make(chan Content),
		Register:   make(chan *User),
		UnRegister: make(chan *User),
		Users:      make(map[string]*User),
		ChatRepo:   repo,
		MessRepo:   mr,
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

			case "message":
				contentStr, ok := msg.Message.(string)
				log.Printf("Message sent from %s, to %s", msg.ClientID, msg.ReceiverID)

				if !ok {
					log.Printf("Warning: Received non-string message from %s", msg.ClientID)
					continue // Skip this message instead of crashing
				}

				// Save to DB using the safe string
				if _, err := s.ChatRepo.SendMessage(msg.ClientID, msg.ReceiverID, contentStr); err != nil {
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

				log.Printf("Receiver Id: %s", msg.ReceiverID)

				chatsSender, err := s.ChatRepo.GetChats(msg.ClientID)
				if err != nil {
					log.Printf("Error fetching history: %s", err)
					continue
				}

				chatsReceiver, err := s.ChatRepo.GetChats(msg.ReceiverID)
				if err != nil {
					log.Printf("Error fetching history: %s", err)
					continue
				}
				// 3. Construct response for the REQUESTER
				response := Content{
					Type:       "history",   // Use a distinct type so frontend knows to parse it
					Message:    chatsSender, // The actual data
					ClientID:   "server",
					ReceiverID: msg.ClientID,
					CreatedAt:  time.Now(),
				}

				response2 := Content{
					Type:       "history",     // Use a distinct type so frontend knows to parse it
					Message:    chatsReceiver, // The actual data
					ClientID:   "server",
					ReceiverID: msg.ReceiverID,
					CreatedAt:  time.Now(),
				}

				// 4. Send back to the SENDER (The person who asked for history)

				s.emit(msg.ClientID, response)
				if msg.ReceiverID != "" && msg.ReceiverID != msg.ClientID {

					s.emit(msg.ReceiverID, response2)
				}

			case "message_history":
				log.Printf("Current User Id: %s", msg.ClientID)
				log.Printf("Type: %s", msg.Type)

				currentUserMessages, err := s.MessRepo.MessageHistory(msg.ClientID, msg.ReceiverID)
				if err != nil {
					log.Printf("Error fetching history: %s", err)
					continue
				}

				response := Content{
					Type:       "history_message",   // Use a distinct type so frontend knows to parse it
					Message:    currentUserMessages, // The actual data
					ClientID:   "server",
					ReceiverID: msg.ClientID,
					CreatedAt:  time.Now(),
				}

				s.emit(msg.ClientID, response)
			}
		}
	}
}

func (s *Station) emit(userID string, msg Content) {
	s.mx.RLock()
	user, ok := s.Users[userID]
	s.mx.RUnlock()

	if ok {
		select {
		case user.Send <- msg:
			log.Printf("Chats go to: %s", userID)
		case <-time.After(time.Millisecond * 50):
			// If the user's channel is full/blocked, don't hang the whole server
			log.Printf("Slow consumer: skipping message for %s", userID)
		}
	}
}
