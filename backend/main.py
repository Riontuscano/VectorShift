from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import pymongo
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environmental configurations from .env
load_dotenv()

app = FastAPI()

# Enable CORS to allow requests from frontend (running on port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.getenv("MONGO_DB", "mongodb://localhost:27017/")
mongo_client = None
db = None
workflows_collection = None
use_db = False

# Try connecting to MongoDB
try:
    mongo_client = pymongo.MongoClient(MONGO_URL, serverSelectionTimeoutMS=1500)
    mongo_client.admin.command('ping')
    db = mongo_client['pipeline_db']
    workflows_collection = db['workflows']
    use_db = True
    print("Successfully connected to MongoDB!")
except Exception as e:
    print(f"MongoDB connection failed: {e}. Falling back to in-memory store.")
    use_db = False

# In-Memory Fallback store
in_memory_workflows = {}

class PipelinePayload(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

@app.get('/')
def read_root():
    return {'Ping': 'Pong'}

# Standard JSON POST endpoint for parsing/validating
@app.post('/pipelines/parse')
def parse_pipeline(payload: PipelinePayload):
    nodes = payload.nodes
    edges = payload.edges
    dag_status = verify_dag(nodes, edges)
    return {
        'num_nodes': len(nodes),
        'num_edges': len(edges),
        'is_dag': dag_status
    }

# Save pipeline with a name
@app.post('/pipelines/save/{name}')
def save_workflow(name: str, payload: PipelinePayload):
    doc = {
        "name": name,
        "nodes": payload.nodes,
        "edges": payload.edges,
        "nodes_count": len(payload.nodes),
        "edges_count": len(payload.edges),
        "saved_at": datetime.now().isoformat()
    }

    if use_db:
        workflows_collection.replace_one({"name": name}, doc, upsert=True)
    else:
        in_memory_workflows[name] = doc

    return {"status": "saved", "name": name}

# Load pipeline by name
@app.get('/pipelines/load/{name}')
def load_workflow(name: str):
    doc = None
    if use_db:
        doc = workflows_collection.find_one({"name": name})
    else:
        doc = in_memory_workflows.get(name)

    if not doc:
        raise HTTPException(status_code=404, detail="Workflow not found.")

    return {
        "nodes": doc["nodes"],
        "edges": doc["edges"]
    }

# List all saved workflows with metadata
@app.get('/pipelines/list')
def list_workflows():
    results = []
    if use_db:
        cursor = workflows_collection.find({}, {"_id": 0, "name": 1, "nodes_count": 1, "edges_count": 1, "saved_at": 1})
        results = list(cursor)
    else:
        results = [
            {
                "name": doc["name"],
                "nodes_count": doc["nodes_count"],
                "edges_count": doc["edges_count"],
                "saved_at": doc["saved_at"]
            }
            for doc in in_memory_workflows.values() if doc is not None
        ]
    results.sort(key=lambda x: x.get("saved_at", ""), reverse=True)
    return results

# Clear workflow by name
@app.delete('/pipelines/clear/{name}')
def clear_workflow(name: str):
    if use_db:
        result = workflows_collection.delete_one({"name": name})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Workflow not found.")
    else:
        if name in in_memory_workflows:
            del in_memory_workflows[name]
        else:
            raise HTTPException(status_code=404, detail="Workflow not found.")

    return {"status": "cleared", "name": name}

# Compatibility Form-based endpoint
@app.post('/pipelines/parse-form')
def parse_pipeline_form(pipeline: str = Form(...)):
    import json
    try:
        data = json.loads(pipeline)
        nodes = data.get('nodes', [])
        edges = data.get('edges', [])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON string in form data")
    
    dag_status = verify_dag(nodes, edges)
    return {
        'num_nodes': len(nodes),
        'num_edges': len(edges),
        'is_dag': dag_status
    }

def verify_dag(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> bool:
    # 1. Build adjacency list representation of the graph
    adj = {node["id"]: [] for node in nodes}
    for edge in edges:
        src = edge["source"]
        tgt = edge["target"]
        if src in adj:
            adj[src].append(tgt)

    # 2. Cycle detection DFS (0 = unvisited, 1 = visiting, 2 = visited)
    visited = {node["id"]: 0 for node in nodes}

    def has_cycle(u: str) -> bool:
        visited[u] = 1 # visiting
        for v in adj.get(u, []):
            if visited.get(v, 0) == 1:
                return True # Found back edge (cycle)
            if visited.get(v, 0) == 0:
                if has_cycle(v):
                    return True
        visited[u] = 2 # fully visited
        return False

    for node in nodes:
        node_id = node["id"]
        if visited[node_id] == 0:
            if has_cycle(node_id):
                return False # Cycle detected, not a DAG

    return True # Directed Acyclic Graph

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
