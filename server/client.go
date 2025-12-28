package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/gofiber/contrib/websocket"
)

type Client struct {
	UserID string
	Hub    *Hub
	Conn   *websocket.Conn
	Send   chan Message
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	for {
		_, p, err := c.Conn.ReadMessage()
		fmt.Printf("What is p: %v", p)
		if err != nil {
			log.Printf("error: %v", err)
			break
		}

		var msg Message
		if err := json.Unmarshal(p, &msg); err != nil {
			continue
		}
		fmt.Printf("Message struct content: %v\nMessage struct recipient id: %v", msg.Content, msg.RecipientID)

		msg.SenderID = c.UserID

		c.Hub.Broadcast <- msg
	}
}

func (c *Client) WritePump() {
	for msg := range c.Send {
		err := c.Conn.WriteJSON(msg)
		if err != nil {
			break
		}
	}
}
