package main

import (
	"encoding/json"
	"fmt"
	"log"

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
	for con := range u.Send {
		err := u.Conn.WriteJSON(con)
		if err != nil {
			break
		}
	}
}
