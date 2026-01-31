# My Mini Messenger

A real-time messaging application built with **Go**, **WebSocket**, and **WebRTC** for learning purposes. This is a 1-to-1 chat application with video/audio calling capabilities.

## 📚 Learning Objectives

## Reason

###
  I wanted to learn Go Programming language, also websocket, and webRTC. So, building a simple Chat Application is the entry of the learning curve to understand what is websocket, how really to use it, manipulate it, what is really behind the realtime communication, and how does messenger does it's thing.
###

###
  But, in all honesty is that Mr. Primeagen voice is all I am hearing in my brain saying that "If I wanted to learn a new language, I want to learn first the language(I think he says here that the features?? or the learning curve?? Something about the language), and then the networking, and the TCP, etc.". So, thanks Mr.Primeagen you voice keeps me awake at night hehe. 
###
###
  All in all, Go Language is I think the most fun language I have ever written, the simplicity of it, and all. Error handling (Yeah yeaahh I know). I love error handling, despite most developers hate the if's statements, buuuuttttt sttiilllll!!!! I lovee the language, and maybe I will explore it more, till I had enough of it and I will master this language.
###

###
  You can rate this repository, you can hate it, you can love it. This is my learning curve of Go, Websocket, and WebRTC. I don't care.
###

###
  Most of the hardest parts are vibe coded, and also all of it are refactored by Claude code, and Gemini, for improvements of the code.
###

This project demonstrates:

- **Go Backend**: Building a WebSocket server with Fiber framework
- **WebSocket**: Real-time bidirectional communication
- **WebRTC**: Peer-to-peer video/audio calling
- **React Frontend**: Modern UI with context API and React Router
- **Firebase Authentication**: User identity management
- **PostgreSQL**: Data persistence

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                        │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  Auth Context  │  │ Socket Context │  │Theme Context │  │
│  │  (Firebase)    │  │ (WebSocket)    │  │              │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
│           │                  │                                │
│           ├──────────────────┼─────────────────┐            │
│           │                  │                 │            │
│       [Chat Page]     [WebSocket]        [WebRTC]          │
│       [Components]      [Messaging]      [Calling]          │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┴──────────────────┐
          │                                   │
    [ws://localhost:8080/ws]          (WebRTC Signaling)
          │                                   │
┌─────────┴───────────────────────────────────┴──────────────┐
│                    SERVER (Go/Fiber)                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           WebSocket Connection Handler              │ │
│  │  • Firebase Token Validation                        │ │
│  │  • Heartbeat/Ping-Pong (45s)                       │ │
│  │  • Connection Management                           │ │
│  └──────────────────────────────────────────────────────┘ │
│                           │                                │
│  ┌────────────────┐  ┌────┴─────────┐  ┌──────────────┐  │
│  │    Station     │  │  Routes      │  │  Repository  │  │
│  │  (Hub)         │  │  (API)       │  │  (DB Queries)│  │
│  │                │  │              │  │              │  │
│  │• Register      │  │• User        │  │• User        │  │
│  │• Unregister    │  │• Chat        │  │• Chat        │  │
│  │• Broadcast     │  │• Message     │  │• Message     │  │
│  │• Message       │  │              │  │              │  │
│  │  Routing       │  │              │  │              │  │
│  └────────────────┘  └──────────────┘  └──────────────┘  │
│           │                                                │
│           └────────────┬──────────────┘                   │
│                        │                                   │
│              ┌─────────┴──────────┐                        │
│              │   PostgreSQL       │                        │
│              │   Database         │                        │
│              │                    │                        │
│              │ • users            │                        │
│              │ • chats            │                        │
│              │ • messages         │                        │
│              └────────────────────┘                        │
└────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
pet-care-pro-v2/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/              # UI Components
│   │   │   ├── Alert.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── CallModal.tsx       # Video/Audio Call UI
│   │   │   ├── ChatBar.tsx
│   │   │   ├── Message.tsx
│   │   │   └── ...
│   │   ├── context/                # State Management
│   │   │   ├── AuthContext.tsx     # Firebase Auth
│   │   │   ├── SocketContext.tsx   # WebSocket + WebRTC
│   │   │   ├── ChatContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── pages/                  # Page Components
│   │   │   ├── Chat.tsx            # Main chat page
│   │   │   └── auth/
│   │   │       ├── Login.tsx
│   │   │       └── Register.tsx
│   │   ├── hooks/                  # Custom Hooks
│   │   │   ├── api/
│   │   │   │   └── chatHooks.ts
│   │   │   ├── auth/
│   │   │   │   └── authHooks.ts
│   │   │   └── windowSize/
│   │   │       └── useWindowSize.ts
│   │   ├── config/
│   │   │   └── firebase.ts         # Firebase config
│   │   ├── service/                # API/Auth Services
│   │   │   ├── apiService.ts
│   │   │   ├── authService.ts
│   │   │   └── cn.ts
│   │   ├── types.ts                # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── server/                          # Go Backend
│   ├── main.go                     # Entry point, graceful shutdown
│   ├── station.go                  # Hub/Station (message router)
│   ├── users.go                    # User connection handler
│   ├── api/                        # API Handlers
│   │   ├── user.go
│   │   └── chat.go
│   ├── routes/                     # Route setup
│   │   ├── route.go
│   │   ├── user.go
│   │   └── chat.go
│   ├── config/                     # Configuration
│   │   └── database.go             # PostgreSQL connection
│   ├── model/                      # Data models
│   │   └── types.go
│   ├── repository/                 # Database queries
│   │   ├── user.go
│   │   ├── chat.go
│   │   └── messages.go
│   ├── go.mod
│   └── go.sum
│
├── frontend/                        # (Unused - legacy)
├── backend/                         # (Unused - legacy)
└── README.md                        # This file
```

---

## 🔄 Message Flow

### 1. **Chat Message Flow**

```
User A sends message
    ↓
[SocketContext] sends via WebSocket
    ↓
[Server] receives on /ws endpoint
    ↓
[Station.Broadcast] routes to recipient
    ↓
[Repository] saves to PostgreSQL
    ↓
[Station] sends to User B's channel
    ↓
[User B's Client] receives and displays
```

### 2. **WebRTC Call Flow**

```
User A initiates call
    ↓
[SocketContext] sends "initiateCall" via WebSocket
    ↓
[Server] routes to User B
    ↓
[User B] gets incoming call notification
    ↓
User B accepts
    ↓
[RTCPeerConnection] creates offer → answer exchange
    ↓
ICE candidates gathered and exchanged via WebSocket signaling
    ↓
Peer connection established
    ↓
Direct peer-to-peer audio/video stream
```

### 3. **Heartbeat/Keep-Alive**

```
Every 40 seconds (Client)
    ↓
[SocketContext] sends { type: "ping" }
    ↓
[Server] receives ping
    ↓
[Server] automatically responds with pong
    ↓
[Client] connection stays alive on Render (no cold sleep)
```

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** 16+ (for client)
- **Go** 1.18+ (for server)
- **PostgreSQL** 12+ (for database)
- **Firebase Project** (for authentication)

### Step 1: Clone Repository

```bash
git clone <your-repo-url>
cd pet-care-pro-v2
```

### Step 2: Set up PostgreSQL Database

```bash
# Create database
createdb websocketdb

# Connect to database
psql -U postgres -d websocketdb

# The server will auto-create tables on first run
```

### Step 3: Server Setup (Go)

```bash
cd server

# Install dependencies
go mod download

# Create .env file
cat > .env << EOF
PASSWORD=your_postgres_password
EOF

# Run server
go run .
# Server starts on http://localhost:8080
```

### Step 4: Client Setup (React)

```bash
cd ../client

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << EOF
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
EOF

# Run development server
npm run dev
# Client starts on http://localhost:5173
```

---

## 🔑 Key Features Implemented

### ✅ Production-Ready Features

- [x] **Heartbeat/Ping-Pong** - Keeps connection alive every 45s (server), 40s (client)
- [x] **Graceful Shutdown** - Clean connection closure on server restart
- [x] **Firebase Authentication** - Secure user identity verification
- [x] **WebSocket Connection Validation** - Token verification on connect
- [x] **Error Handling** - Proper disconnect messages and error logging
- [x] **Connection Timeout** - 60-second read deadline on server
- [x] **Database Persistence** - All messages saved to PostgreSQL

### 🎯 Core Features

- [x] Real-time 1-to-1 messaging
- [x] Typing indicators
- [x] Message history/loading
- [x] User search
- [x] Video calling (WebRTC)
- [x] Audio calling (WebRTC)
- [x] Mute/unmute audio
- [x] Toggle video on/off
- [x] STUN servers for NAT traversal

---

## 📋 Message Types (WebSocket Protocol)

```typescript
// Chat message
{ type: "message", user_id: "uid", receiver_id: "uid2", content: "text" }

// Typing indicator
{ type: "typing", user_id: "uid", receiver_id: "uid2" }

// Load message history
{ type: "loadHistory", user_id: "uid", receiver_id: "uid2", before?: "timestamp" }

// Search users
{ type: "searchUser", search: "name" }

// WebRTC Signaling
{ type: "initiateCall", user_id: "uid", receiver_id: "uid2", call_type: "video"|"audio" }
{ type: "answer", user_id: "uid", answer: RTCSessionDescription }
{ type: "offer", user_id: "uid", offer: RTCSessionDescription }
{ type: "ice_candidate", user_id: "uid", candidate: RTCIceCandidate }
{ type: "endCall", user_id: "uid" }

// Keep-alive
{ type: "ping" }
```

---

## 🔒 Security Considerations

### Current Implementation

- ✅ Firebase token validation on WebSocket connect
- ✅ User existence verification before accepting connection
- ✅ HTTPS/WSS recommended for production
- ✅ Environment variables for sensitive data (Firebase, DB password)

### For Production (Recommended)

- [ ] Change CORS from `"*"` to specific domain
- [ ] Use WSS (WebSocket Secure) instead of WS
- [ ] Implement rate limiting on API endpoints
- [ ] Add request validation/sanitization
- [ ] Use environment-specific configurations

---

## 🐛 Troubleshooting

### Client can't connect to server

- Check server is running on `localhost:8080`
- Verify Firebase token is being sent
- Check browser console for WebSocket errors

### WebRTC calls not connecting

- Ensure both users are authenticated
- Check if ICE servers are reachable
- Verify firewall allows peer connections
- Check browser console for WebRTC errors

### Server goes to sleep on Render

- Heartbeat automatically prevents this
- If still sleeping, upgrade to paid Render tier

### Database connection failed

- Verify PostgreSQL is running
- Check `.env` password is correct
- Ensure database `websocketdb` exists

---

## 📚 Learning Resources

### WebSocket

- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Go Fiber WebSocket](https://docs.gofiber.io/api/middleware/websocket/)

### WebRTC

- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC for Peer-to-Peer Communication](https://webrtc.org/)

### Go

- [Go Official Tour](https://go.dev/tour/welcome/1)
- [Fiber Framework](https://gofiber.io/)

### React

- [React Context API](https://react.dev/reference/react/useContext)
- [React Hooks](https://react.dev/reference/react/hooks)

---

## 🚀 Future Enhancements

- [ ] Message encryption (E2E)
- [ ] Group chats (1-to-many)
- [ ] Message read receipts
- [ ] Screen sharing
- [ ] File sharing
- [ ] Offline message queuing
- [ ] Mobile app (React Native)
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Unit & integration tests

---

## 📝 License

This project is for learning purposes. See [LICENSE](./LICENSE) file for details.

---

## 👤 Jacob Mary Tapere: Author

Built as a learning project to master Go, WebSocket, and WebRTC.

---

## 📞 Support

For issues or questions, check the code comments or console logs for debugging information.
