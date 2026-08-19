# 🌐 VectorShift - Visual Workflow Builder & Pipeline Parser

An intuitive, premium node-based visual workflow builder designed for composing LLM pipelines, API integrations, routing logic, and advanced automation flows. Built with a React + React Flow frontend and a FastAPI backend.

---

## 📸 Website Preview

Here is a visual preview of the workflow builder in action. You can replace the image below with your own custom screenshot by saving it to `screenshots/dashboard_preview.png`.

<div align="center">
  <img src="./screenshots/dashboard_preview.png" alt="VectorShift Pipeline Builder Screenshot" width="90%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" />
</div>

---

## ✨ Key Features

### 🎨 Frontend (React + React Flow)
* **Custom Node Abstraction (`BaseNode`)**: A unified, reusable wrapper for all nodes. This abstract base class handles header logic, status indicator rings, customizable input/output ports, theme configuration, styling, and dynamic rows.
* **9 Specialized Nodes**:
  - **LLM Node**: Connects system and prompt inputs to LLM inference models.
  - **API Node**: Configures custom API calls (GET/POST) with URL, header, and body data.
  - **Text Node**: Features an auto-adjusting textarea (scales dynamically with typing length) and **dynamic variable handles** (e.g., typing `{{ variable }}` automatically spawns a corresponding input port on the left).
  - **Delay Node**: Introduces timed pauses in execution.
  - **JSON Node**: Parses and formats raw JSON data.
  - **Router & Switch Nodes**: Implements conditional branching logic based on incoming data.
  - **Notification Node**: Broadcasts alerts or system webhooks.
  - **Input / Output Nodes**: Form-based entry/exit points for workflow parameters.
* **Premium Glassmorphic Styling**: Dark mode UI built with vanilla CSS, smooth grid layouts, custom transition animations, and status indicators (`running`, `completed`, `skipped`, `error`).

### ⚙️ Backend (FastAPI)
* **Directed Acyclic Graph (DAG) Parser**: Traverses the layout structure using cycle-detection DFS to determine if it is a valid, loop-free DAG.
* **Save/Load Workflow Slots**: Persists and restores pipelines in specific slots (both dynamically in MongoDB or fallback in-memory stores).
* **LLM Groq Proxy**: Directly executes LLM requests via Groq (`llama-3.3-70b-versatile`).
* **API Proxy**: Handles cross-origin requests securely, executing API node calls from the backend server.
* **History Log**: Saves and retrieves historical pipeline execution data.

---

## 🛠️ Project Structure

```bash
├── README.md                # Root project documentation
├── .env.example             # Backend environment template (copy to .env)
├── render.yaml              # Render Blueprint for the backend
├── screenshots/             # Workflow Builder screenshots
│   └── dashboard_preview.png
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── nodes/           # Node definitions (baseNode, textNode, apiNode, etc.)
│   │   ├── components/      # UI components (Canvas, Toolbar)
│   │   ├── store.js         # Zustand global state store
│   │   ├── config.js        # API base URL (reads REACT_APP_API_URL)
│   │   └── submit.js        # Backend API triggers
│   ├── .env.example         # Frontend environment template
│   ├── vercel.json          # Vercel build configuration
│   └── package.json
└── backend/                 # FastAPI backend application
    ├── main.py              # Backend server & pipeline parser logic
    └── requirements.txt     # Python dependencies
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v16.0.0 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (Optional, falls back to an in-memory database automatically if not detected)

---

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template and fill it in. Every value is optional for local
   development — without `GROQ_API_KEY` only the LLM node is unavailable, and without
   a reachable `MONGO_DB` the backend falls back to an in-memory store automatically:
   ```bash
   cp ../.env.example ../.env
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```
   *The backend will be available at [http://localhost:8000](http://localhost:8000).
   Health check: [http://localhost:8000/health](http://localhost:8000/health).*

---

### 3. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the package dependencies:
   ```bash
   npm install
   ```
3. *(Optional)* Point the app at a non-default backend:
   ```bash
   cp .env.example .env.local     # then edit REACT_APP_API_URL
   ```
   Skip this and it defaults to `http://localhost:8000`.
4. Start the React development server:
   ```bash
   npm run dev
   ```
   *The frontend will open in your browser at [http://localhost:3000](http://localhost:3000).*

---

## ☁️ Deployment

The two halves deploy independently: **backend on Render**, **frontend on Vercel**.
Deploy the backend first — the frontend needs its URL at build time.

### 1. Backend → Render

Either route works. The Blueprint is less error-prone; the manual route is
useful if you already created the service.

#### Option A — Blueprint (recommended)

Push this repo to GitHub, then in the Render dashboard choose
**New → Blueprint** and select it. Render reads [`render.yaml`](./render.yaml)
from the repo root and provisions the service, prompting for the three secret
values. Nothing else to configure.

#### Option B — Manual setup

**New → Web Service**, connect the repo, then set:

| Setting | Value |
|---|---|
| Language / Runtime | `Python 3` |
| Branch | `main` |
| **Root Directory** | `backend` |
| Build Command | `pip install --upgrade pip && pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |
| Instance Type | `Free` |

The two settings people get wrong here are **Root Directory** — leave it blank
and the build fails with `requirements.txt not found` — and **`$PORT`**, which
must be passed through verbatim. Render assigns the port at runtime; a
hardcoded `--port 8000` makes the health check time out and Render kills the
deploy as unhealthy.

#### Environment variables (both options)

| Variable | Required | Notes |
|---|---|---|
| `ALLOWED_ORIGINS` | recommended | Your Vercel URL, e.g. `https://your-app.vercel.app`. Comma-separate multiple origins, no spaces, no trailing slashes. Leave unset and it defaults to `*`, which is fine for a smoke test but should not stay that way. |
| `MONGO_DB` | no | MongoDB Atlas connection string. Omit to use the in-memory store, which is **wiped on every restart and not shared between instances**. |
| `GROQ_API_KEY` | no | Needed only by the LLM node; every other node works without it. |
| `ENVIRONMENT` | preset | `production` — disables uvicorn auto-reload. |
| `PYTHON_VERSION` | preset | `3.12.7`. |
| `PORT` | — | **Do not set.** Render injects it. |

#### Verify

```bash
curl https://<your-service>.onrender.com/health
# {"status":"ok","database":"mongodb"}      <- Atlas connected
# {"status":"ok","database":"in-memory"}    <- no/unreachable MONGO_DB
```

> **Free-tier note:** Render spins idle free services down. The first request
> after a sleep takes ~30–50 s while the container cold-starts, which looks
> like the frontend hanging. This is expected, not a bug in the app.
>
> On the free tier the `in-memory` fallback is effectively useless for
> persistence — saved workflows vanish on every cold start. Use MongoDB Atlas
> (its free M0 tier is enough) if slots need to survive.

#### Keeping the backend warm

[`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml) pings
`/health` every 14 minutes so the service does not hit Render's ~15 minute idle
timeout. To enable it:

**Settings → Secrets and variables → Actions → Variables → New repository variable**

| Name | Value |
|---|---|
| `BACKEND_URL` | `https://<your-service>.onrender.com` (no trailing slash) |

Until that variable exists the job exits cleanly rather than failing, so it will
not email you every 14 minutes. You can trigger a run by hand from the **Actions**
tab (`Run workflow`) to check the setup.

Two limits to be aware of before relying on this:

- **GitHub's scheduled runs are best-effort**, and are routinely delayed by
  several minutes under load — sometimes past the 15-minute threshold. This
  greatly reduces cold starts; it does not eliminate them. If you need a hard
  guarantee, point an external monitor (UptimeRobot, cron-job.org) at `/health`
  instead — those fire on time.
- **Render's free tier includes 750 instance-hours per month.** Keeping one
  service awake around the clock costs ~730 h, so a single always-on service
  very nearly consumes the entire monthly allowance. Run a second free service
  on the same account and you will exhaust it and be suspended for the rest of
  the month.

GitHub also disables scheduled workflows on repositories with no activity for
60 days; a push re-enables them.

### 2. Frontend → Vercel

1. **New Project → Import** this repo, and set **Root Directory** to `frontend`.
   [`frontend/vercel.json`](./frontend/vercel.json) supplies the build settings
   and the SPA rewrite.
2. Add one environment variable:

   | Variable | Value |
   |---|---|
   | `REACT_APP_API_URL` | `https://<your-render-service>.onrender.com` (no trailing slash) |

3. Deploy.

> **Important:** Create React App inlines `REACT_APP_*` variables at **build**
> time. Changing `REACT_APP_API_URL` requires a **redeploy** — restarting or
> editing the variable alone will not change the shipped bundle.

> **Why the build command is `CI=false npm run build`:** Vercel sets `CI=true`,
> and Create React App treats *any* ESLint warning as a fatal error when `CI` is
> set. This project compiles with warnings, so a plain `npm run build` fails on
> Vercel with `Treating warnings as errors because process.env.CI = true`.
> Warnings still appear in the build log — they are just no longer fatal.

### 3. Close the CORS loop

Once Vercel gives you the production URL, go back to Render and set
`ALLOWED_ORIGINS` to it, then redeploy the backend. Until you do, the browser
blocks every API call with a CORS error while the network tab shows the
requests being made.

---

## ⚡ How It Works (Backend Integration)

1. Design your pipeline on the canvas by dragging nodes from the left panel.
2. Connect handles from outputs to inputs.
3. Click the **Submit** button in the navbar.
4. The frontend sends the structured `nodes` and `edges` JSON payload to the `/pipelines/parse` endpoint on the backend.
5. An alert appears immediately showing the total **nodes count**, **edges count**, and **DAG validation status** (whether it forms a loop-free Directed Acyclic Graph).

---

## 🤝 Contributing

1. **Fork** this repository and clone your fork.
2. Create a branch: `git checkout -b fix/short-description`.
3. Follow the setup steps above and confirm both servers run.
4. Make your changes. Keep commits focused — one logical change each, with a
   message that explains *why*, not just *what*.
5. Before opening a PR, verify:
   ```bash
   cd frontend && npm run build          # must compile
   cd ../backend && python -m py_compile main.py
   ```
6. Push and open a Pull Request against `main`. In the description, state what
   you changed, how you reproduced the original behaviour, and how you verified
   the fix.

**Never commit secrets.** `.env` is gitignored — use `.env.example` as the
template and keep real keys out of the repo and out of your commit history.
