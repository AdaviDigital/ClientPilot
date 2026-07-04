# AI Customer Support Platform

A full-stack customer support platform combining an AI chatbot (OpenAI), human-agent
live chat, ticket management, and an analytics dashboard.

**Stack:** React (Vite) + Tailwind CSS · Node.js/Express · MongoDB (Mongoose) · Socket.io · OpenAI API

---

## 1. Features

| Feature | Description |
|---|---|
| **User login** | JWT-based auth with three roles: `customer`, `agent`, `admin`. |
| **AI chatbot** | Customers chat with an OpenAI-powered assistant. If the AI can't resolve the issue, it auto-escalates by creating a ticket and switching the conversation to live mode. |
| **Ticket management** | Create, list, filter, reply to, and update (status/priority/assignee) support tickets. |
| **Live chat** | Real-time chat between customers and agents via Socket.io once a conversation is escalated or an agent joins. |
| **Dashboard** | At-a-glance summary of tickets/conversations, recent activity, and quick actions. |
| **Analytics** | Charts for ticket volume over time, breakdown by status/category, and average resolution time. |

---

## 2. Project Structure

```
ai-support-platform/
├── server/                     # Node.js/Express backend
│   ├── config/db.js            # MongoDB connection
│   ├── models/                 # Mongoose schemas (User, Ticket, Conversation, Message)
│   ├── controllers/            # Route handler logic
│   ├── routes/                 # Express routers
│   ├── middleware/              # auth (JWT) + centralized error handling
│   ├── socket/socketHandler.js # Socket.io live chat logic
│   ├── utils/                  # token generation, OpenAI wrapper, DB seed script
│   ├── server.js               # App entry point
│   └── package.json
├── client/                     # React frontend (Vite)
│   └── src/
│       ├── api/axios.js        # Pre-configured Axios instance (auto-attaches JWT)
│       ├── context/AuthContext.jsx
│       ├── components/         # Sidebar, Navbar, ChatWidget, StatCard, ProtectedRoute
│       ├── pages/               # Login, Register, Dashboard, Tickets, TicketDetail, LiveChat, Analytics
│       ├── App.jsx
│       └── main.jsx
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_SCHEMA.md
│   └── DEPLOYMENT_GUIDE.md
└── README.md
```

---

## 3. Prerequisites

- Node.js 18+
- MongoDB (local install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- An OpenAI API key ([platform.openai.com](https://platform.openai.com/api-keys))

---

## 4. Quick Start (Local Development)

### 4.1 Backend

```bash
cd server
npm install
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, OPENAI_API_KEY
npm run seed     # optional: creates demo admin/agent/customer accounts
npm run dev      # starts on http://localhost:5000
```

Demo accounts created by `npm run seed`:

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | password123 |
| Agent | agent@example.com | password123 |
| Customer | customer@example.com | password123 |

### 4.2 Frontend

```bash
cd client
npm install
npm run dev      # starts on http://localhost:5173
```

Open `http://localhost:5173` in your browser. Vite proxies `/api` and `/socket.io`
requests to the backend automatically in development (see `client/vite.config.js`).

---

## 5. Environment Variables (server/.env)

See `server/.env.example` for the full list:

- `PORT` — backend port (default 5000)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` / `JWT_EXPIRES_IN` — auth token signing
- `OPENAI_API_KEY` / `OPENAI_MODEL` — AI chatbot
- `CLIENT_URL` — frontend origin, used for CORS

---

## 6. Further Documentation

- [API Documentation](docs/API_DOCUMENTATION.md) — every REST endpoint, request/response shape, and auth requirements.
- [Database Schema](docs/DATABASE_SCHEMA.md) — collections, fields, relationships, and indexes.
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) — deploying to production (Render/Railway/EC2 + Vercel/Netlify + MongoDB Atlas).

---

## 7. Security Notes

- Passwords are hashed with bcrypt before storage; the hash is never returned by the API.
- All ticket/chat/analytics routes require a valid JWT (`Authorization: Bearer <token>`).
- Role-based access control restricts ticket updates to agents/admins and analytics to agents/admins.
- `helmet` sets secure HTTP headers; `express-rate-limit` throttles the API; CORS is restricted to `CLIENT_URL`.
- Treat this as a solid starting point — before real production use, add refresh tokens, input sanitization/validation (e.g. `zod`/`joi`), audit logging, and HTTPS termination.

## 8. Suggested Next Steps

- Add email notifications when a ticket is created/updated.
- Add file attachments to tickets (e.g. via S3).
- Add pagination to the Live Chat conversation list.
- Add automated tests (Jest + Supertest for the API, React Testing Library for the UI).
