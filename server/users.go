package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/gofiber/contrib/websocket"
)

type User struct {
	UserId  string
	Station *Station
	Conn    *websocket.Conn
	Send    chan Content
}

func (u *User) ReadInjection() {
	defer func() {
		u.Station.UnRegister <- u
		u.Conn.Close()
	}()

	// Set up ping handler to respond to pings with pongs
	u.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	u.Conn.SetPongHandler(func(string) error {
		u.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, p, err := u.Conn.ReadMessage()
		fmt.Printf("P: %v", p)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("Unexpected error: %v", err)
			} else {
				log.Println("User disconnected normally")
			}
			return
		}

		var con Content

		if err := json.Unmarshal(p, &con); err != nil {
			continue
		}

		fmt.Printf("Message struct content: %v\nMessage struct recipient id: %v", con.Message, con.ReceiverID)
		con.ClientID = u.UserId

		u.Station.Broadcast <- con
	}
}

func (u *User) WriteInjection() {
	ticker := time.NewTicker(45 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case con, ok := <-u.Send:
			if !ok {
				return
			}
			err := u.Conn.WriteJSON(con)
			if err != nil {
				return
			}
		case <-ticker.C:
			// Send ping every 45 seconds
			err := u.Conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(time.Second))
			if err != nil {
				log.Printf("Failed to send ping: %v", err)
				return
			}
		}
	}
}
