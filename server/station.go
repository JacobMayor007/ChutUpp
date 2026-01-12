package main

import (
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
		case user := <-s.Register:
			s.mx.Lock()
			s.Users[user.UserId] = user
			s.mx.Unlock()
			log.Printf("User Joined: %s", user.UserId)

		case user := <-s.UnRegister:

			s.mx.Lock()
			if _, ok := s.Users[user.UserId]; ok {
				delete(s.Users, user.UserId)
				close(user.Send)
				log.Printf("User Left: %s", user.UserId)
			}
			s.mx.Unlock()

		case msg := <-s.Broadcast:
			msg.CreatedAt = time.Now()

<<<<<<< HEAD
			log.Printf("Type: %s", msg.Type)
			log.Printf("Sender Id: %s", msg.ClientID)
			log.Printf("Reciever Id: %s", msg.ReceiverID)

			if msg.Type == "message" {
				if _, err := s.Repo.SetChats(msg.ClientID, msg.ReceiverID, msg.Message); err != nil {
					log.Printf("Error in message station %s", err)
					continue
				}
=======
			if _, err := s.Repo.SetChats(msg.ClientID, msg.ReceiverID, msg.Message); err != nil {
				log.Printf("error in message station %s", err)
				continue
>>>>>>> 36d353e870a3a92512049044059065c65fef7165
			}

			s.mx.RLock()
			reciever, ok := s.Users[msg.ReceiverID]
			s.mx.RUnlock()

			if ok {

				select {

				case reciever.Send <- msg:
					log.Printf("Message routed from %s to %s", msg.ClientID, msg.ReceiverID)
				default:
					close(reciever.Send)
					s.mx.Lock()
					delete(s.Users, msg.ReceiverID)
					s.mx.Unlock()
				}
			} else {
				log.Printf("Message failed: Recipient %s is offline", msg.ReceiverID)
			}

		}
	}
}
