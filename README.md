# AI SupportDesk — Phase 1 + Phase 2 + Phase 3

A mini AI-powered customer support SaaS built with **MERN + Socket.IO + Groq AI**.

**Phase 1 (foundation):**
- Business signup (creates a User + a Workspace automatically)
- Login with JWT authentication
- A public link customers use to submit tickets — no login needed
- Agent dashboard: list, filter, and manage tickets (status + priority)
- Real-time chat between agent and customer on each ticket (Socket.IO)
- Typing indicator

**Phase 2 (AI features):**
- **AI priority detection** — when a customer submits a ticket, AI reads the
  subject and automatically sets its priority (low/medium/high/urgent)
- **AI reply suggestions** — on the agent's ticket page, an "✨ AI Suggest"
  button drafts a reply based on the conversation, which the agent can edit
  before sending
- **AI chat assistant** — on the customer's chat page, "✨ Ask AI now" gets an
  instant AI-generated answer without waiting for a human agent

**Phase 3 (just added):**
- **Knowledge Base** — agents write articles; customers see matching articles
  live as they type their issue, before even submitting a ticket
- **Analytics dashboard** — total tickets, average resolution time, a 7-day
  ticket volume chart, and breakdowns by status/priority
- **Team / admin panel** — the workspace owner can add or remove agents
- **Email notifications** (optional) — customers get an email when an agent
  replies; new agents get their login details by email. If you skip the
  email setup, everything still works — emails are just skipped and logged
  to the terminal instead.

---

## 1. Project structure

```
ai-supportdesk/
├── backend/      → Node.js + Express + MongoDB + Socket.IO API
└── frontend/     → React (Vite) app
```

---

## 2. Set up MongoDB (step-by-step, free, no local install needed)

You don't need MongoDB installed on your computer — we'll use **MongoDB
Atlas**, a free cloud database.

1. Go to **https://www.mongodb.com/cloud/atlas/register** and create a free account.
2. After signing up, it'll ask you to create a cluster — choose the **free
   "M0" tier**, pick any cloud provider/region close to you, and click
   **Create**.
3. When asked to create a database user, set a **username and password**
   (write these down, you'll need them). This is *not* your Atlas login —
   it's a separate database user.
4. Under **Network Access** (left sidebar), click **Add IP Address** →
   choose **Allow access from anywhere** (`0.0.0.0/0`). This is fine for
   development.
5. Once your cluster is ready, click **Connect** → **Drivers** → copy the
   connection string. It looks like this:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with the database user you created
   in step 3. Optionally add a database name before the `?`, e.g.
   `.../supportdesk?retryWrites=true...`.

That's it — this string goes into the backend's `.env` file (next step).

---

## 3. Get a free Groq API key (powers the AI features)

1. Go to **https://console.groq.com** and sign up (free).
2. Once logged in, go to **API Keys** in the left sidebar.
3. Click **Create API Key**, give it any name, and copy the key it shows you
   (it starts with `gsk_...`). You won't be able to see it again, so copy it
   now.
4. This key goes into the backend's `.env` file as `GROQ_API_KEY` (next step).

Groq's free tier is generous and plenty for development/testing. This
project uses the `openai/gpt-oss-20b` model, which is on Groq's free
developer tier — if Groq changes their lineup again in the future and you
get a "model not found" error, open `backend/utils/aiClient.js` and swap
the `MODEL` value for whatever's current in Groq's docs
(https://console.groq.com/docs/models).

---

## 4. (Optional) Set up email notifications

Skip this section entirely if you don't need emails yet — the app works
fine without it, it'll just print emails to the terminal instead of
sending them.

If you want real emails (using a free Gmail account):

1. Turn on **2-Step Verification** on your Google account, if it isn't
   already: **https://myaccount.google.com/security**.
2. Go to **https://myaccount.google.com/apppasswords**.
3. Create a new App Password (name it anything, e.g. "AI SupportDesk").
   Google will show you a **16-character password** — copy it. This is
   *not* your normal Gmail password, and it only works for this one app.
4. In the backend `.env`, set:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_actual_gmail@gmail.com
   SMTP_PASS=the_16_character_app_password
   ```
   (No spaces in the app password when you paste it.)

---

## 5. Run the backend

```bash
cd backend
npm install
```

If you don't already have a `.env` file in the `backend` folder, create
one:

```bash
cp .env.example .env
```

**Only run that `cp` command once, ever.** If `.env` already exists with
your real values, running it again will overwrite your real values with
the placeholder ones — just open and edit `.env` directly instead.

Now open `.env` and fill in:
- `MONGO_URI` → the connection string from step 2
- `JWT_SECRET` → any random long string (mash your keyboard)
- `GROQ_API_KEY` → the key from step 3
- `SMTP_*` → only if you did step 4

Then start the server:

```bash
npm run dev
```

You should see:
```
MongoDB connected: cluster0.xxxxx.mongodb.net
Server running on port 5000
```

If you see a connection error, double-check your MongoDB username/password
and that Network Access allows your IP (step 4 of the MongoDB section above).

---

## 6. Run the frontend

Open a **new terminal window** (keep the backend running):

```bash
cd frontend
npm install
npm run dev
```

This starts the app at **http://localhost:5173**.

---

## 7. Try it out

**Core flow:**
1. Go to `http://localhost:5173/signup` and create a business account.
2. On the dashboard, copy your **customer support link**.
3. Open that link in an **incognito window** (simulating a customer) and
   start typing an issue — if it matches a knowledge base article, it'll
   show up live before you even submit.
4. Submit the ticket — notice its priority is set automatically by AI.
5. On the customer's chat page, try **"✨ Ask AI now"** for an instant
   AI answer, or **"Send to agent"** for a human.
6. Back on the agent dashboard, open the ticket, reply (try **"✨ AI
   Suggest"** first), and watch it appear instantly on the customer side.

**Phase 3 features:**
7. Click **"Knowledge Base"** in the navbar → add an article (e.g. title
   "How do I reset my password?", with an answer). Go back to the public
   support link and start typing a matching issue — it'll surface live.
8. Click **"Analytics"** → see ticket totals, resolution time, and charts
   (numbers show up once you have a few tickets).
9. Click **"Team"** (only visible to the workspace owner) → add an agent
   by name + email. If you set up email (step 4), they'll get their
   password by email; otherwise it's shown right there on the page so you
   can share it manually. Log in as them in a separate/incognito browser
   to see the agent's view.

---

## 8. Common issues

- **"MongoDB connection failed"** → check your `.env` MONGO_URI, and that
  your Atlas user's password doesn't contain special characters that need
  URL-encoding (or just avoid special characters when creating the user).
- **CORS error in browser console** → make sure `CLIENT_URL` in backend
  `.env` matches the frontend URL exactly (`http://localhost:5173`).
- **Messages not appearing live** → make sure the backend is running on
  port 5000 (frontend is hardcoded to connect to `http://localhost:5000`).
- **"GROQ_API_KEY is missing from .env"** → you haven't added your Groq
  key yet, or the server needs restarting after you added it.
- **"model does not exist or you do not have access to it"** → Groq
  changed their model lineup; see the note at the end of step 3 above.
- **AI features feel slow or fail** → Groq's free tier can rate-limit under
  heavy testing; wait a few seconds and try again.
- **Emails not arriving** → check the backend terminal — if SMTP isn't
  configured, it logs `[email skipped — SMTP not configured]` instead of
  sending. If you did configure it and it's still failing, double check
  you're using an **App Password**, not your normal Gmail password.
- **"Only the workspace owner can do this"** → the Team page's add/remove
  actions are restricted to the owner account (the one that signed up and
  created the workspace), not regular agents.

---

## 9. Ideas for what's next

The core product is now feature-complete across all three phases. If you
want to keep extending it:
- Let agents leave internal notes on a ticket (not visible to the customer)
- Auto-close tickets that have been "resolved" for a few days with no reply
- A simple canned-responses library agents can insert with one click
- Role-based permissions (e.g. agents who can only see tickets assigned to them)
- Deploy it for real: frontend to Vercel/Netlify, backend to Render/Railway
