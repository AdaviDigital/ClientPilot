# API Documentation

Base URL (dev): `http://localhost:5000/api`

All responses use the shape `{ success: boolean, data?: any, message?: string }`.
Authenticated routes require the header: `Authorization: Bearer <JWT>`.

---

## Auth — `/api/auth`

### POST `/auth/register`
Register a new user. Public.

**Body**
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123", "role": "customer" }
```
`role` may only be `customer` or `agent` on public signup (admins are created directly in the DB or seed script).

**Response `201`**
```json
{ "success": true, "data": { "_id": "...", "name": "Jane Doe", "email": "jane@example.com", "role": "customer", "token": "<jwt>" } }
```

### POST `/auth/login`
**Body:** `{ "email": "...", "password": "..." }`
**Response `200`:** same shape as register.

### GET `/auth/me` 🔒
Returns the authenticated user's profile (no password field).

---

## Tickets — `/api/tickets` 🔒 (all routes require auth)

### POST `/tickets`
Create a ticket. Any authenticated user.
**Body:** `{ "subject": "...", "description": "...", "priority": "medium", "category": "general" }`

### GET `/tickets?status=&priority=&category=&page=&limit=`
List tickets. Customers see only their own; agents/admins see all. Supports filtering and pagination.
**Response:** `{ success, data: [...tickets], pagination: { total, page, pages } }`

### GET `/tickets/:id`
Get a single ticket with populated `createdBy`, `assignedTo`, and `replies.sender`.
Customers can only fetch their own tickets (403 otherwise).

### PUT `/tickets/:id` — role: `agent`, `admin`
Update `status`, `priority`, `category`, or `assignedTo`. Setting status to `resolved`/`closed` stamps `resolvedAt`.

### POST `/tickets/:id/replies`
Add a reply to the ticket thread. Auto-transitions status from `open` to `in_progress`.
**Body:** `{ "message": "..." }`

### DELETE `/tickets/:id` — role: `admin`
Deletes a ticket.

---

## Chat (AI + Live) — `/api/chat` 🔒

### POST `/chat/start`
Starts a new AI conversation for the logged-in customer and returns a welcome bot message.

### POST `/chat/:conversationId/message`
Sends a message. If the conversation is still in `bot` mode, the message is forwarded to
OpenAI and the assistant's reply is returned. If the AI's reply contains an internal
`[ESCALATE]` marker, the platform automatically:
1. Creates a new ticket (`source: "ai_escalation"`).
2. Switches the conversation's `mode` to `live`.
3. Returns the created ticket in the response so the UI can notify the customer.

If the conversation is already in `live` mode, no AI call is made — use the Socket.io
events documented below instead.

**Response `201`**
```json
{
  "success": true,
  "data": {
    "userMessage": { "...": "..." },
    "botMessage": { "...": "..." } ,
    "escalatedTicket": null
  }
}
```

### GET `/chat/:conversationId/messages`
Returns the full ordered message history for a conversation.

### GET `/chat`
List conversations. Customers see their own; agents/admins see active `live` conversations waiting for or in a chat.

### PUT `/chat/:conversationId/join` — role: `agent`, `admin`
Agent claims a live conversation (sets `agent` field and `mode: "live"`).

---

## Analytics — `/api/analytics` 🔒 — role: `agent`, `admin`

### GET `/analytics/summary`
Returns `{ totalTickets, openTickets, resolvedTickets, totalConversations, totalCustomers, avgResolutionHours }`.

### GET `/analytics/tickets-by-status`
Returns `[{ _id: "open", count: 12 }, ...]` — ticket counts grouped by status.

### GET `/analytics/tickets-timeline`
Returns daily ticket counts for the last 14 days: `[{ _id: "2026-06-20", count: 3 }, ...]`.

### GET `/analytics/tickets-by-category`
Returns ticket counts grouped by category.

---

## Socket.io Events (Live Chat)

Connect with: `io(URL, { auth: { token: '<jwt>' } })`

| Event (client → server) | Payload | Description |
|---|---|---|
| `join_conversation` | `conversationId` | Joins the room for that conversation |
| `send_message` | `{ conversationId, content }` | Sends a live chat message; persisted and broadcast |
| `typing` | `{ conversationId, isTyping }` | Broadcasts a typing indicator to the room |

| Event (server → client) | Payload | Description |
|---|---|---|
| `new_message` | Message object | Broadcast to all sockets in the conversation room |
| `user_typing` | `{ userId, name, isTyping }` | Typing indicator from the other participant |
| `error_message` | `{ message }` | Sent to the sender if persisting a message fails |

---

## Error Format

All errors follow: `{ "success": false, "message": "Human readable error" }` with an
appropriate HTTP status code (400, 401, 403, 404, 500).
