package main

import (
	"log"
	"sync"
)

type Content struct {
	Type       string `json:"type"`
	Message    string `json:"content"`
	ClientID   string `json:"user_id"`
	ReceiverID string `json:"receiver_id"`
}

type Station struct {
	mx         sync.RWMutex
	Users      map[string]*User
	Broadcast  chan Content
	Register   chan *User
	UnRegister chan *User
}

func NewStation() *Station {
	return &Station{
		Broadcast:  make(chan Content),
		Register:   make(chan *User),
		UnRegister: make(chan *User),
		Users:      make(map[string]*User),
	}
}

func (s *Station) Run() {
	for {
		select {
		case user := <-s.Register:
			s.mx.Lock()
			s.Users[user.UserId] = user
			s.mx.Unlock()
			log.Printf("User Joined: %s | Total Online: %d", user.UserId, len(s.GetOnlineUsers()))

		case user := <-s.UnRegister:
			
			s.mx.Lock()
			if _, ok := s.Users[user.UserId]; ok {
				delete(s.Users, user.UserId)
				close(user.Send)
				log.Printf("User Left: %s | Total Online: %d", user.UserId, len(s.Users))
			}
			s.mx.Unlock()

		case msg := <-s.Broadcast:
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

func (st *Station) GetOnlineUsers() []string {
	st.mx.RLock()
	defer st.mx.RUnlock()

	var users []string
	for userID := range st.Users {
		users = append(users, userID)
	}
	return users
}
