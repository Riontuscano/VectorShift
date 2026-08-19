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

1. Push this repo to GitHub, then in the Render dashboard choose
   **New → Blueprint** and select it. Render reads [`render.yaml`](./render.yaml)
   and provisions a Python web service from the `backend/` directory.
2. Set these environment variables on the service:

   | Variable | Required | Notes |
   |---|---|---|
   | `ALLOWED_ORIGINS` | yes | Your Vercel URL, e.g. `https://your-app.vercel.app`. Comma-separate multiple origins. Leave unset to allow all (`*`). |
   | `MONGO_DB` | no | MongoDB Atlas connection string. Omit to use the in-memory store, which is **wiped on every restart and not shared between instances**. |
   | `GROQ_API_KEY` | no | Needed only by the LLM node. |
   | `ENVIRONMENT` | preset | `production` — disables uvicorn auto-reload. |

3. Render supplies `PORT` automatically; the start command binds to it.
   Liveness is polled at `/health`.

> **Free-tier note:** Render spins idle free services down. The first request
> after a sleep takes ~30–50 s while the container cold-starts, which looks
> like the frontend hanging. This is expected, not a bug in the app.

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
