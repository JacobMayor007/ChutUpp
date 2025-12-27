package main

import (
	"encoding/json"
	"log"

	"github.com/gofiber/contrib/websocket"
)

type Client struct {
	UserID string
	Hub    *Hub

	Conn *websocket.Conn

	Send chan Message
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	for {
		// ReadMessage works exactly the same
		_, p, err := c.Conn.ReadMessage()
		if err != nil {
			log.Printf("error: %v", err)
			break
		}

		var msg Message
		if err := json.Unmarshal(p, &msg); err != nil {
			continue
		}
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
