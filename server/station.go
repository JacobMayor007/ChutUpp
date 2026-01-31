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
	Search     string    `json:"search"`
	ClientID   string    `json:"user_id"`
	ReceiverID string    `json:"receiver_id"`
	CreatedAt  time.Time `json:"created_at"`
	// WebRTC specific fields
	CallType  string `json:"call_type,omitempty"`  // "video" or "audio"
	Offer     any    `json:"offer,omitempty"`      // RTCSessionDescription
	Answer    any    `json:"answer,omitempty"`     // RTCSessionDescription
	Candidate any    `json:"candidate,omitempty"`  // RTCIceCandidate
	FromEmail string `json:"from_email,omitempty"` // Caller's email for display
}

type Station struct {
	mx         sync.RWMutex
	Users      map[string]*User
	Broadcast  chan Content
	Register   chan *User
	UnRegister chan *User
	ChatRepo   repository.ChatRepository
	MessRepo   repository.MessageInterface
	UserRepo   repository.UserRepository
}

func NewStation(repo repository.ChatRepository, mr repository.MessageInterface, ur repository.UserRepository) *Station {
	return &Station{
		Broadcast:  make(chan Content),
		Register:   make(chan *User),
		UnRegister: make(chan *User),
		Users:      make(map[string]*User),
		ChatRepo:   repo,
		MessRepo:   mr,
		UserRepo:   ur,
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
					continue
				}

				// Save to DB
				if _, err := s.ChatRepo.SendMessage(msg.ClientID, msg.ReceiverID, contentStr); err != nil {
					log.Printf("Error saving message: %s", err)
					continue
				}

				// Route to receiver
				s.emit(msg.ReceiverID, msg)

			case "typing":
				s.emit(msg.ReceiverID, msg)

			case "chat":
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

				response := Content{
					Type:       "history",
					Message:    chatsSender,
					ClientID:   "server",
					ReceiverID: msg.ClientID,
					CreatedAt:  time.Now(),
				}

				response2 := Content{
					Type:       "history",
					Message:    chatsReceiver,
					ClientID:   "server",
					ReceiverID: msg.ReceiverID,
					CreatedAt:  time.Now(),
				}

				s.emit(msg.ClientID, response)
				if msg.ReceiverID != "" && msg.ReceiverID != msg.ClientID {
					s.emit(msg.ReceiverID, response2)
				}

			case "message_history":
				log.Printf("Current User Id: %s", msg.ClientID)

				before := msg.Message.(string)

				currentUserMessages, err := s.MessRepo.MessageHistory(msg.ClientID, msg.ReceiverID, before)
				if err != nil {
					log.Printf("Error fetching history: %s", err)
					continue
				}

				response := Content{
					Type:       "history_message",
					Message:    currentUserMessages,
					ClientID:   "server",
					ReceiverID: msg.ClientID,
					CreatedAt:  time.Now(),
				}

				s.emit(msg.ClientID, response)

			case "search":
				log.Printf("Current user id: %s", msg.ClientID)
				log.Printf("Data: %s", msg.Search)

				searchUser, err := s.UserRepo.SearchUser(msg.Search)
				if err != nil {
					log.Println("Error occurred in searching user")
					continue
				}

				response := Content{
					Type:       "result",
					Message:    searchUser,
					ClientID:   "server",
					ReceiverID: msg.ClientID,
					CreatedAt:  time.Now(),
				}

				s.emit(msg.ClientID, response)

			// ===== WebRTC SIGNALING MESSAGES =====

			case "call_initiate":
				// Forward call initiation to receiver
				log.Printf("Call initiate: %s -> %s (type: %s)", msg.ClientID, msg.ReceiverID, msg.CallType)

				// Get caller email from database

				response := Content{
					Type:       "call_initiate",
					ClientID:   msg.ClientID,
					ReceiverID: msg.ReceiverID,
					CallType:   msg.CallType,
					Offer:      msg.Offer,
					CreatedAt:  time.Now(),
				}

				log.Printf("Emitting call_initiate to %s", msg.ReceiverID)
				s.emit(msg.ReceiverID, response)

			case "call_answer":
				// Forward call answer to initiator
				log.Printf("Call answer: %s -> %s", msg.ClientID, msg.ReceiverID)

				response := Content{
					Type:       "call_answer",
					ClientID:   msg.ClientID,
					ReceiverID: msg.ReceiverID,
					Answer:     msg.Answer,
					CreatedAt:  time.Now(),
				}

				s.emit(msg.ReceiverID, response)

			case "call_reject":
				// Forward call rejection to initiator
				log.Printf("Call rejected: %s -> %s", msg.ClientID, msg.ReceiverID)

				response := Content{
					Type:       "call_reject",
					ClientID:   msg.ClientID,
					ReceiverID: msg.ReceiverID,
					CreatedAt:  time.Now(),
				}

				s.emit(msg.ReceiverID, response)

			case "call_end":
				// Forward call end to other party
				log.Printf("Call ended: %s -> %s", msg.ClientID, msg.ReceiverID)

				response := Content{
					Type:       "call_end",
					ClientID:   msg.ClientID,
					ReceiverID: msg.ReceiverID,
					CreatedAt:  time.Now(),
				}

				s.emit(msg.ReceiverID, response)

			case "ice_candidate":
				// Forward ICE candidate to peer
				log.Printf("ICE candidate: %s -> %s", msg.ClientID, msg.ReceiverID)

				response := Content{
					Type:       "ice_candidate",
					ClientID:   msg.ClientID,
					ReceiverID: msg.ReceiverID,
					Candidate:  msg.Candidate,
					CreatedAt:  time.Now(),
				}

				s.emit(msg.ReceiverID, response)
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
			log.Printf("Message delivered to: %s", userID)
		case <-time.After(time.Millisecond * 50):
			log.Printf("Slow consumer: skipping message for %s", userID)
		}
	} else {
		log.Printf("User %s not found or offline", userID)
	}
}

// Shutdown gracefully closes all user connections
func (s *Station) Shutdown() {
	s.mx.Lock()
	defer s.mx.Unlock()

	log.Printf("Closing connections for %d users", len(s.Users))

	// Send disconnect message to all users before closing
	for userID, user := range s.Users {
		log.Printf("Closing connection for user: %s", userID)

		// Send disconnect notification
		disconnectMsg := Content{
			Type:    "disconnect",
			Message: "Server shutting down",
		}

		select {
		case user.Send <- disconnectMsg:
		case <-time.After(100 * time.Millisecond):
		}

		// Close the WebSocket connection
		user.Conn.Close()
	}

	// Clear users map
	s.Users = make(map[string]*User)
	log.Println("All connections closed")
}
