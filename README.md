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
├── screenshots/             # Workflow Builder screenshots
│   └── dashboard_preview.png
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── nodes/           # Node definitions (baseNode, textNode, apiNode, etc.)
│   │   ├── components/      # UI components (Canvas, Toolbar)
│   │   ├── store.js         # Zustand global state store
│   │   └── submit.js        # Backend API triggers
│   └── package.json
└── backend/                 # FastAPI backend application
    ├── main.py              # Backend server & pipeline parser logic
    └── .env                 # API Keys and database credentials
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
   pip install fastapi uvicorn pymongo pydantic python-dotenv
   ```
4. Create a `.env` file in the root workspace or `backend` folder with your API key if you plan to use the LLM node:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   MONGO_DB=mongodb://localhost:27017/  # Optional
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```
   *The backend will be available at [http://localhost:8000](http://localhost:8000).*

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
3. Start the React development server:
   ```bash
   npm run dev
   ```
   *The frontend will open in your browser at [http://localhost:3000](http://localhost:3000).*

---

## ⚡ How It Works (Backend Integration)

1. Design your pipeline on the canvas by dragging nodes from the left panel.
2. Connect handles from outputs to inputs.
3. Click the **Submit** button in the navbar.
4. The frontend sends the structured `nodes` and `edges` JSON payload to the `/pipelines/parse` endpoint on the backend.
5. An alert appears immediately showing the total **nodes count**, **edges count**, and **DAG validation status** (whether it forms a loop-free Directed Acyclic Graph).
