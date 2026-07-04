# Database Schema

MongoDB database with four main collections, managed via Mongoose. All collections
use Mongoose's automatic `_id`, `createdAt`, and `updatedAt` (via `timestamps: true`).

---

## 1. `users`

Stores customers, support agents, and admins in a single collection distinguished by `role`.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | String | Required |
| `email` | String | Required, unique, lowercased |
| `password` | String | Required, bcrypt-hashed, `select: false` (never returned by default) |
| `role` | String enum | `customer` \| `agent` \| `admin`. Default `customer` |
| `avatar` | String | Optional profile image URL |
| `isActive` | Boolean | Default `true`; deactivated users cannot log in |
| `createdAt` / `updatedAt` | Date | Auto-managed |

**Indexes:** unique index on `email`.

---

## 2. `tickets`

Support tickets raised by customers and worked by agents.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `subject` | String | Required |
| `description` | String | Required |
| `status` | String enum | `open` \| `in_progress` \| `resolved` \| `closed`. Default `open` |
| `priority` | String enum | `low` \| `medium` \| `high` \| `urgent`. Default `medium` |
| `category` | String enum | `billing` \| `technical` \| `account` \| `general` \| `other` |
| `createdBy` | ObjectId → `users` | The customer who raised the ticket |
| `assignedTo` | ObjectId → `users` | The agent assigned to resolve it (nullable) |
| `replies` | Array of sub-documents | `{ sender: ObjectId → users, message: String, createdAt: Date }` |
| `source` | String enum | `manual` \| `ai_escalation` \| `live_chat` |
| `resolvedAt` | Date | Set when status becomes `resolved`/`closed` |
| `createdAt` / `updatedAt` | Date | Auto-managed |

**Indexes:**
- `{ status: 1, createdAt: -1 }` — fast filtering/sorting on the tickets list view
- `{ createdBy: 1 }` — fast lookup of "my tickets"
- `{ assignedTo: 1 }` — fast lookup of an agent's assigned tickets

**Relationships:** `createdBy` and `assignedTo` reference `users`. `replies.sender` also references `users`.

---

## 3. `conversations`

Represents a single chat session, which starts with the AI bot and can be escalated to a live agent.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `customer` | ObjectId → `users` | Required |
| `agent` | ObjectId → `users` | Nullable; set once an agent joins |
| `mode` | String enum | `bot` \| `live`. Default `bot` |
| `status` | String enum | `active` \| `closed`. Default `active` |
| `escalatedTicket` | ObjectId → `tickets` | Nullable; set if the AI escalates the conversation |
| `createdAt` / `updatedAt` | Date | Auto-managed |

---

## 4. `messages`

Individual chat messages belonging to a conversation (from bot, customer, or agent).

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `conversation` | ObjectId → `conversations` | Required |
| `senderType` | String enum | `customer` \| `agent` \| `bot` |
| `sender` | ObjectId → `users` | Null when `senderType` is `bot` |
| `content` | String | Required |
| `createdAt` / `updatedAt` | Date | Auto-managed |

**Indexes:** `{ conversation: 1, createdAt: 1 }` — efficient retrieval of a conversation's message history in order.

---

## Entity Relationship Overview

```
 users (1) ───< tickets (createdBy)
 users (1) ───< tickets (assignedTo)
 users (1) ───< tickets.replies (sender)

 users (1) ───< conversations (customer)
 users (1) ───< conversations (agent)
 conversations (1) ───< messages (conversation)
 conversations (1) ─── 1 tickets (escalatedTicket, optional)
```
