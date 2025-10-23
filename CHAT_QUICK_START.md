# 💬 Chat Service - Quick Start Guide

## ✅ What's Ready

All services are up and running:
- ✅ **Chat Service** - http://localhost:8005 (Backend API + WebSocket)
- ✅ **Frontend** - http://localhost:8080 or http://localhost:5173 (with Chat UI)
- ✅ **Auth Service** - http://localhost:8001 (User authentication)
- ✅ **MongoDB** - Running (erp_chat database)

## 🚀 How to Use - 3 Simple Steps

### Step 1: Access Chat

1. Go to http://localhost:8080 (or http://localhost:5173 for dev)
2. Login with any user account
3. Click **"Messages"** in the sidebar menu (💬 icon)

### Step 2: Create a Test Conversation

Since the user picker UI isn't implemented yet, create a conversation via API:

```bash
# Replace with your actual user IDs and tokens
USER1_ID="68f29d880fff601746dc15ea"  # Get from login response
USER2_ID="68f02dc27114e147dc4eb573"  # Another user's ID
TOKEN="your_jwt_token"  # From login

curl -X POST http://localhost:8005/api/v1/chat/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"participant_ids\": [\"$USER1_ID\", \"$USER2_ID\"],
    \"is_group\": false
  }"
```

### Step 3: Start Chatting!

1. Refresh the Messages page
2. You'll see the conversation in the left panel
3. Click on it
4. Type a message and click "Send"
5. **Open another browser window** (incognito/different browser)
6. Login as the other user
7. Go to Messages - **you'll see the message instantly!** 🎉

## 🧪 Full Test Scenario

### Test Real-Time Messaging

**Window 1: Manager (test@gmail.com)**
```
1. Login to http://localhost:8080
2. Go to Messages
3. See conversation list
4. Click on a conversation
5. Type "Hello from manager!"
6. Click Send
```

**Window 2: Superadmin (admin@gmail.com)**
```
1. Login to http://localhost:8080 (different browser/incognito)
2. Go to Messages
3. **Message appears instantly!** ✅
4. Reply: "Hi! Message received!"
5. Click Send
```

**Window 1: Manager**
```
6. **Reply appears instantly!** ✅
7. Real-time chat working! 🎉
```

## 📊 Features Available

### ✅ What Works Now

- ✅ Real-time messaging (instant delivery)
- ✅ Message history
- ✅ Unread message counts
- ✅ Read receipts
- ✅ Conversation list
- ✅ Timestamps
- ✅ User names in messages
- ✅ WebSocket connection status indicator
- ✅ Responsive design (works on mobile)
- ✅ Auto-scroll to latest message

### ⏳ Coming Soon

- ⏳ User picker for creating conversations
- ⏳ Search conversations
- ⏳ File attachments
- ⏳ Typing indicators
- ⏳ Message reactions
- ⏳ Edit messages
- ⏳ Group chat management

## 🐛 Troubleshooting

### Chat Service Not Accessible

```bash
# Check if running
docker-compose ps chat-service

# Check logs
docker-compose logs --tail=50 chat-service

# Restart
docker-compose restart chat-service
```

### Messages Not Updating in Real-Time

1. Check browser console for WebSocket errors
2. Look for "Chat WebSocket connected" message
3. If disconnected, refresh the page
4. Check chat service logs for errors

### "No Conversations" Message

This is normal! To create conversations, use the API command above or wait for the user picker UI.

### Frontend Build Errors

```bash
# Check if date-fns is installed
cd erp-frontend
npm install date-fns

# Restart frontend
docker-compose restart frontend
```

## 🎨 UI Overview

### Messages Page Layout

```
┌────────────────────────────────────────────────────┐
│  Messages              ● Connected      [+ New]    │
├──────────────┬─────────────────────────────────────┤
│              │  Chat with John Doe                 │
│ Conversations│  john@example.com                   │
│              ├─────────────────────────────────────┤
│ John Doe     │                                     │
│ 2 unread     │  John: Hey, how are you?           │
│ 5 min ago    │  10:30 AM                           │
│              │                                     │
│ Sarah Admin  │           You: I'm good!            │
│ 10 min ago   │           10:32 AM                  │
│              │                                     │
│ Team Project │                                     │
│ Group • 3    │                                     │
│ 1h ago       │                                     │
│              ├─────────────────────────────────────┤
│              │  [Type a message...] [Send]         │
└──────────────┴─────────────────────────────────────┘
```

## 🔧 API Examples

### Get My Conversations
```bash
curl http://localhost:8005/api/v1/chat/conversations \
  -H "Authorization: Bearer $TOKEN"
```

### Get Messages in a Conversation
```bash
curl http://localhost:8005/api/v1/chat/conversations/CONV_ID/messages \
  -H "Authorization: Bearer $TOKEN"
```

### Send a Message
```bash
curl -X POST http://localhost:8005/api/v1/chat/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "CONV_ID",
    "content": "Hello!",
    "sender_id": "YOUR_USER_ID",
    "message_type": "text"
  }'
```

### Get Unread Count
```bash
curl http://localhost:8005/api/v1/chat/unread-count \
  -H "Authorization: Bearer $TOKEN"
```

## 📝 Notes

- The chat service uses the same MongoDB instance as other services
- Chat data is stored in the `erp_chat` database
- WebSocket connections are authenticated with JWT tokens
- Messages are delivered instantly to all connected participants
- The frontend automatically reconnects if WebSocket drops

---

**Created**: October 18, 2025  
**Status**: ✅ Ready to Use  
**Location**: http://localhost:8080/dashboard/messages

**Enjoy your new real-time chat system!** 💬✨

