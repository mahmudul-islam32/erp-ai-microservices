# Quick Test Instructions - Chat Message Display Fix

## 🚀 Services Status
✅ **All services are running and healthy!**

## 📱 Application URL
**Frontend**: http://localhost:8080

## 👥 Test Users Available

Use these credentials to test the chat functionality:

| User | Email | Password | Role |
|------|-------|----------|------|
| User A | admin@example.com | admin123 | Super Admin |
| User B | manager@example.com | manager123 | Manager |
| User C | employee@example.com | employee123 | Employee |
| User D | john.admin@example.com | admin123 | Admin |
| User E | sarah.admin@example.com | admin123 | Admin |

## 🧪 Quick Test (5 minutes)

### Step 1: Open Two Browser Windows

1. **Window 1 (Chrome)**: 
   - Go to http://localhost:8080
   - Login: `admin@example.com` / `admin123`

2. **Window 2 (Incognito/Firefox)**:
   - Go to http://localhost:8080
   - Login: `manager@example.com` / `manager123`

### Step 2: Start a Chat (Window 1 - Admin)

1. Click the **message icon** in the top-right header
2. Click **"+ New Chat"**
3. Select **"Michael Brown (manager@example.com)"**
4. Click **"Start Conversation"**
5. **KEEP THIS CHAT WINDOW OPEN**

### Step 3: Send Message (Window 2 - Manager)

1. Click the **message icon** in the top-right header
2. Click on the conversation with Admin
3. Type: **"Hello Admin! Testing chat."**
4. Click **Send**

### Step 4: Observe (Window 1 - Admin)

✅ **EXPECTED RESULTS**:
- Message appears **IMMEDIATELY** in the chat window
- Message reads: "Hello Admin! Testing chat."
- **NO** increase in the unread message count
- **NO** notification sound (since chat is open)

### Step 5: Test Unread Count

1. **In Window 1 (Admin)**: CLOSE the chat window (X button)
2. **In Window 2 (Manager)**: Send another message: "Are you there?"
3. **In Window 1 (Admin)**: 
   - ✅ Unread count should show **1**
   - Open chat → Message appears immediately
   - Unread count resets to **0**

## 🎯 What Was Fixed

### Before ❌
- Messages didn't appear in open chat windows
- Had to close/reopen to see messages
- Unread count increased even for open conversations

### After ✅  
- Messages appear **instantly** in open chat windows
- Unread count only increases for **closed** conversations
- Auto mark-as-read when conversation is open
- Real-time chat experience!

## 📊 Console Logs (Optional)

Open Browser DevTools (F12) → Console to see:

```
📨 Received WebSocket message: [id] for conversation: [conv_id]
✅ Message is for active conversation, marking as read
✅ Marked messages as read for conversation: [conv_id]
```

## ✅ Success Criteria

- [x] Services running
- [x] Demo users created
- [x] New endpoint working (mark-as-read)
- [ ] **Test 1**: Messages appear immediately ← **TEST THIS**
- [ ] **Test 2**: Unread count accurate ← **TEST THIS**
- [ ] **Test 3**: No notification for active conversation ← **TEST THIS**

## 🔧 Technical Details

**New Endpoint**: `POST /api/v1/chat/conversations/{id}/mark-read`

**Modified Files**:
- Backend: `chat-service/app/api/v1/chat.py`
- Frontend: 
  - `erp-frontend/src/features/chat/services/chatApi.ts`
  - `erp-frontend/src/features/chat/hooks/useChat.ts`
  - `erp-frontend/src/features/chat/components/ChatWindow.tsx`

## 📝 Notes

- WebSocket connection indicated by **green dot** in chat header
- Chat works in both floating window and full page
- Messages sync across all open sessions
- Backend logs show successful API calls (200 OK)

---

**Ready to test!** 🚀

Open http://localhost:8080 in two browser windows and follow the steps above.

