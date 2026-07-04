# Deployment Guide

This guide covers three ways to deploy the platform: **Railway**, **Render**, and
**Google Cloud Run**. Pick one — you don't need all three. Each is a complete,
independent path from an empty account to a live app.

In all three cases, the shape of the deployment is the same:
1. A MongoDB Atlas database (shared across all options).
2. The `server/` backend deployed as a Node.js web service (or container).
3. The `client/` frontend deployed as a static/SPA build, pointed at the backend's URL.

---

## 0. Prerequisites (do this once, regardless of platform)

### 0.1 Push your code to GitHub
```bash
cd ai-support-platform
git init
git add .
git commit -m "Initial commit"
gh repo create ai-support-platform --public --source=. --push
# or manually: git remote add origin <your-repo-url> && git push -u origin main
```

### 0.2 Create a MongoDB Atlas database
1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free (M0) cluster.
2. **Database Access** → add a database user with a username/password.
3. **Network Access** → add `0.0.0.0/0` (allow from anywhere) to start; tighten later if your platform has static egress IPs.
4. **Connect** → "Drivers" → copy the connection string, e.g.:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/ai-support-platform
   ```
   Use this as `MONGO_URI`.

### 0.3 Get an OpenAI API key
Create one at [platform.openai.com/api-keys](https://platform.openai.com/api-keys) and make sure billing/quota is set up.

### 0.4 Generate a JWT secret
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Use the output as `JWT_SECRET`. Never reuse the example value from `.env.example`.

---

## 1. Deploy to Railway

Railway deploys the backend and frontend as two separate services inside one project.

### 1.1 Backend service
1. Go to [railway.com](https://railway.com) → sign in with GitHub.
2. **New Project → Deploy from GitHub repo** → select your repo.
3. Railway auto-detects it as a monorepo. Click into the created service → **Settings → Source** → set **Root Directory** to `server`.
4. Railway auto-detects Node.js and uses `npm install` / `npm start` from `server/package.json` — no build command needed.
5. Go to the **Variables** tab and add:
   ```
   NODE_ENV=production
   MONGO_URI=<your Atlas connection string>
   JWT_SECRET=<your generated secret>
   JWT_EXPIRES_IN=7d
   OPENAI_API_KEY=<your OpenAI key>
   OPENAI_MODEL=gpt-4o-mini
   CLIENT_URL=<your frontend URL — fill this in after step 1.2>
   ```
   Do **not** set `PORT` — Railway injects it automatically, and `server.js` already reads `process.env.PORT`.
6. **Settings → Networking → Generate Domain**. You'll get something like `https://ai-support-api-production.up.railway.app`. Copy this — it's your backend URL.
7. Socket.io works out of the box on Railway (WebSockets are supported by default on generated domains); no extra config needed.

### 1.2 Frontend service
1. In the same Railway project, click **New → GitHub Repo** → select the same repo again.
2. Set **Root Directory** to `client`.
3. **Settings → Variables**, add:
   ```
   VITE_API_URL=https://ai-support-api-production.up.railway.app/api
   VITE_SOCKET_URL=https://ai-support-api-production.up.railway.app
   ```
4. **Settings → Deploy**, set:
   - Build command: `npm install && npm run build`
   - Start command: `npx serve -s dist -l $PORT` (or add a tiny static server — see note below)
5. **Settings → Networking → Generate Domain** to get your public frontend URL, e.g. `https://ai-support-web-production.up.railway.app`.
6. Go back to the **backend** service's Variables and set `CLIENT_URL` to this frontend URL (needed for CORS), then redeploy the backend.

> **Note on serving the static build:** Railway's Node buildpack expects a process to stay running; a Vite build alone produces static files with nothing to serve them. Either add `"serve": "serve -s dist"` as a `start` script in `client/package.json` (install `serve` as a dependency), or use the Dockerfile approach in Section 3 for a self-contained static server via nginx.

### 1.3 Seed demo data (optional)
From your local machine, pointing at the Atlas database:
```bash
cd server
MONGO_URI="<your Atlas URI>" npm run seed
```

---

## 2. Deploy to Render

Render also deploys backend and frontend as separate services within one account.

### 2.1 Backend — Web Service
1. Go to [dashboard.render.com](https://dashboard.render.com) → sign in with GitHub.
2. **New → Web Service** → connect your repo.
3. Configure:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (for testing) or a paid tier for production (the free tier spins down after 15 minutes of inactivity, causing a 30–60s cold start on the next request)
4. Under **Environment**, add the same variables as the Railway list above (`NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `CLIENT_URL` — fill in `CLIENT_URL` after step 2.2). Render sets `PORT` automatically; `server.js` already respects it.
5. Click **Create Web Service**. Render builds and deploys; watch progress on the **Events** page.
6. Once live, your backend URL looks like `https://ai-support-api.onrender.com`.

### 2.2 Frontend — Static Site
1. **New → Static Site** → connect the same repo.
2. Configure:
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
3. Under **Environment**, add:
   ```
   VITE_API_URL=https://ai-support-api.onrender.com/api
   VITE_SOCKET_URL=https://ai-support-api.onrender.com
   ```
   (Static sites on Render only use env vars at build time, which is exactly what Vite needs.)
4. Add a rewrite rule so client-side routing works on refresh: **Redirects/Rewrites** → source `/*`, destination `/index.html`, action `Rewrite`.
5. Click **Create Static Site**. You'll get a URL like `https://ai-support-web.onrender.com`.
6. Go back to the backend service's **Environment** tab, set `CLIENT_URL` to this frontend URL, and it will auto-redeploy.

### 2.3 Seed demo data (optional)
Same as Railway — run `npm run seed` locally with `MONGO_URI` pointed at Atlas, or use Render's Shell tab on the backend service.

---

## 3. Deploy to Google Cloud Run

Cloud Run runs containers, so both the backend and frontend are deployed as Docker
images (the `Dockerfile`s are already included in `server/` and `client/`). This
path gives you more control and scales to zero when idle, like Railway/Render's free tiers, but without vendor lock-in.

### 3.1 One-time setup
```bash
# Install the gcloud CLI if you haven't: https://cloud.google.com/sdk/docs/install
gcloud auth login
gcloud projects create ai-support-platform-<unique-suffix>
gcloud config set project ai-support-platform-<unique-suffix>
# Enable billing on this project in the Cloud Console (required for Cloud Run/Build)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
gcloud config set run/region us-central1
```

### 3.2 Deploy the backend
From the `server/` directory (which already contains the provided `Dockerfile`):
```bash
cd server
gcloud run deploy ai-support-api \
  --source . \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars NODE_ENV=production,JWT_EXPIRES_IN=7d,OPENAI_MODEL=gpt-4o-mini
```
`--source .` tells Cloud Run to build the Dockerfile automatically via Cloud Build — no manual `docker build`/`push` needed.

Set the remaining secrets separately (better to use `--set-env-vars` for non-secret config and Secret Manager for real secrets in production; the simplified version below is fine to get started):
```bash
gcloud run services update ai-support-api \
  --update-env-vars MONGO_URI="<your Atlas URI>",JWT_SECRET="<your secret>",OPENAI_API_KEY="<your key>"
```
Note the printed service URL, e.g. `https://ai-support-api-xxxxx-uc.a.run.app`. This is your backend URL.

**Important for Live Chat:** Cloud Run supports WebSockets, but each instance handles
its own connections — if you scale to multiple instances, enable **session affinity**
so a client's Socket.io connection stays pinned to the same instance:
```bash
gcloud run services update ai-support-api --session-affinity
```

### 3.3 Deploy the frontend
From the `client/` directory (which contains the provided `Dockerfile` + `nginx.conf`):
```bash
cd ../client
gcloud run deploy ai-support-web \
  --source . \
  --allow-unauthenticated \
  --port 8080 \
  --set-build-env-vars VITE_API_URL=https://ai-support-api-xxxxx-uc.a.run.app/api,VITE_SOCKET_URL=https://ai-support-api-xxxxx-uc.a.run.app
```
(Replace the URL with the actual backend URL from step 3.2. Since Vite bakes env vars in at build time, they must be passed as *build* env vars, not runtime ones.)

Note the printed frontend URL, e.g. `https://ai-support-web-yyyyy-uc.a.run.app`.

### 3.4 Close the loop on CORS
Update the backend's `CLIENT_URL` to the frontend URL from step 3.3:
```bash
gcloud run services update ai-support-api \
  --update-env-vars CLIENT_URL=https://ai-support-web-yyyyy-uc.a.run.app
```

### 3.5 (Optional) Custom domains
```bash
gcloud run domain-mappings create --service ai-support-web --domain app.yourdomain.com
gcloud run domain-mappings create --service ai-support-api --domain api.yourdomain.com
```
Follow the printed DNS instructions (adding CNAME/A records at your registrar).

### 3.6 Seed demo data (optional)
```bash
cd server
MONGO_URI="<your Atlas URI>" npm run seed
```

### 3.7 Continuous deployment (optional)
Connect the repo to Cloud Build triggers so every push to `main` redeploys automatically:
```bash
gcloud builds triggers create github \
  --repo-name=ai-support-platform \
  --repo-owner=<your-github-username> \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```
This requires a `cloudbuild.yaml` describing the build/deploy steps for both services — see [Cloud Build documentation](https://cloud.google.com/build/docs) for the multi-service trigger pattern if you want this.

---

## 4. Comparison at a Glance

| | Railway | Render | Google Cloud Run |
|---|---|---|---|
| Setup speed | Fastest | Fast | Moderate (CLI-based) |
| Free tier | Trial credits, no permanent free tier | Free tier with 15-min cold-start spin-down | Pay-per-use; generous always-free quota, scales to zero |
| WebSockets (Live Chat) | Supported by default | Supported by default | Supported; enable session affinity at scale |
| Best for | Fastest path to a live demo | Predictable free tier for prototypes | Full control, no vendor lock-in, GCP ecosystem |

---

## 5. Post-Deployment Checklist (all platforms)

- [ ] `JWT_SECRET` is a long random value, not the example placeholder.
- [ ] `NODE_ENV=production` is set on the backend.
- [ ] `CLIENT_URL` on the backend exactly matches the deployed frontend origin (CORS).
- [ ] `VITE_API_URL` / `VITE_SOCKET_URL` on the frontend exactly match the deployed backend origin.
- [ ] MongoDB Atlas network access is restricted to known IPs where the platform supports it.
- [ ] OpenAI billing/quota is configured for expected traffic.
- [ ] `GET /api/health` returns `200` from the deployed backend.
- [ ] A test login/register, ticket creation, AI chat message, and live chat message all work end-to-end against the deployed URLs.
- [ ] Uptime monitoring (e.g. UptimeRobot) is pointed at `/api/health`.
