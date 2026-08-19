from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import pymongo
from datetime import datetime
import os
import urllib.request
import json
from dotenv import load_dotenv

load_dotenv()
if not os.getenv("GROQ_API_KEY"):
    load_dotenv(dotenv_path="../.env")

app = FastAPI()

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


in_memory_workflows = { "1": None, "2": None, "3": None }


simulated_db = {
    "users": [
        {"_id": "1", "name": "Alice", "role": "admin", "status": "active"},
        {"_id": "2", "name": "Bob", "role": "user", "status": "active"},
        {"_id": "3", "name": "Charlie", "role": "user", "status": "inactive"}
    ]
}

class PipelinePayload(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

@app.get('/')
def read_root():
    return {'Ping': 'Pong'}


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


@app.post('/pipelines/save/{slot}')
def save_workflow(slot: str, payload: PipelinePayload):
    doc = {
        "slot": slot,
        "nodes": payload.nodes,
        "edges": payload.edges,
        "nodes_count": len(payload.edges),
        "edges_count": len(payload.nodes),
        "saved_at": datetime.now().isoformat()
    }

    if use_db:
        workflows_collection.replace_one({"slot": slot}, doc, upsert=True)
    else:
        in_memory_workflows[slot] = doc

    return {"status": "saved", "slot": slot}


@app.get('/pipelines/load/{slot}')
def load_workflow(slot: str):
    doc = None
    if use_db:
        doc = workflows_collection.find_one({"slot": slot})
    else:
        doc = in_memory_workflows.get(slot)

    if not doc:
        raise HTTPException(status_code=404, detail="No workflow saved under this name.")

    return {
        "nodes": doc.get("nodes", []),
        "edges": doc.get("edges", [])
    }


@app.get('/pipelines/list')
def list_workflows():
    slots_meta = []
    
    if use_db:
        try:
            docs = workflows_collection.find()
            for doc in docs:
                slot_name = doc.get("slot")
                if slot_name:
                    slots_meta.append({
                        "slot": slot_name,
                        "empty": False,
                        "nodes_count": doc.get("nodes_count", 0),
                        "edges_count": doc.get("edges_count", 0),
                        "saved_at": doc.get("saved_at")
                    })
        except Exception as e:
            print(f"Failed to query workflows from MongoDB: {e}")

    default_slots = ["1", "2", "3"]
    existing_slots = {item["slot"] for item in slots_meta}

    for slot in default_slots:
        if slot not in existing_slots:
            doc = in_memory_workflows.get(slot)
            if doc:
                slots_meta.append({
                    "slot": slot,
                    "empty": False,
                    "nodes_count": doc["nodes_count"],
                    "edges_count": doc["edges_count"],
                    "saved_at": doc["saved_at"]
                })
            else:
                slots_meta.append({
                    "slot": slot,
                    "empty": True
                })

    
    for slot, doc in in_memory_workflows.items():
        if slot not in default_slots and doc:
            slots_meta.append({
                "slot": slot,
                "empty": False,
                "nodes_count": doc["nodes_count"],
                "edges_count": doc["edges_count"],
                "saved_at": doc["saved_at"]
            })

    def sort_key(item):
        s = item["slot"]
        if s in ["1", "2", "3"]:
            return (0, s)
        return (1, s)

    return sorted(slots_meta, key=sort_key)

@app.delete('/pipelines/clear/{slot}')
def clear_workflow(slot: str):
    if use_db:
        workflows_collection.delete_one({"slot": slot})
    else:
        if slot in in_memory_workflows:
            in_memory_workflows[slot] = None
        if slot not in ["1", "2", "3"] and slot in in_memory_workflows:
            in_memory_workflows.pop(slot, None)

    return {"status": "cleared", "slot": slot}

class RunHistoryItem(BaseModel):
    workflow_name: str
    status: str
    nodes_count: int
    edges_count: int
    executed_at: str
    outputs: Dict[str, Any]

execution_history = []

@app.post('/pipelines/history/save')
def save_history(item: RunHistoryItem):
    doc = item.dict()
    if use_db:
        try:
            db['history'].insert_one(doc)
        except Exception as e:
            print(f"Failed to save history: {e}")
    execution_history.append(doc)
    return {"status": "history_saved"}

@app.get('/pipelines/history/list')
def list_history():
    if use_db:
        try:
            docs = list(db['history'].find().sort("executed_at", -1).limit(50))
            for d in docs:
                if "_id" in d:
                    d["_id"] = str(d["_id"])
            return docs
        except Exception as e:
            print(f"Failed to query history: {e}")
    return sorted(execution_history, key=lambda x: x["executed_at"], reverse=True)[:50]

class LLMRequest(BaseModel):
    system: str = ""
    prompt: str = ""

@app.post('/pipelines/llm')
def execute_llm(payload: LLMRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured in backend environment.")
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    body = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {
                "role": "system",
                "content": payload.system
            },
            {
                "role": "user",
                "content": payload.prompt
            }
        ],
        "temperature": 0.7
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode('utf-8'),
        headers=headers,
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            choices = res_data.get('choices', [])
            if choices:
                answer = choices[0].get('message', {}).get('content', '')
                return {"response": answer}
            else:
                raise HTTPException(status_code=500, detail="Empty response from Groq API")
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        try:
            err_json = json.loads(err_msg)
            detail = err_json.get('error', {}).get('message', err_msg)
        except Exception:
            detail = err_msg
        raise HTTPException(status_code=e.code, detail=f"Groq API Error: {detail}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Groq: {str(e)}")
class APIProxyRequest(BaseModel):
    url: str
    method: str = "GET"
    payload: Any = None

@app.post('/pipelines/api_proxy')
def api_proxy(payload: APIProxyRequest):
    import urllib.request
    import urllib.error
    
    url = payload.url
    method = payload.method.upper()
    data_bytes = None
    
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/json"
    }
    
    if payload.payload is not None:
        if isinstance(payload.payload, str):
            data_bytes = payload.payload.encode('utf-8')
        else:
            data_bytes = json.dumps(payload.payload).encode('utf-8')
            
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers=headers,
        method=method
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            res_content = response.read().decode('utf-8')
            status_code = response.status
            try:
                return {"response": json.loads(res_content), "status": status_code}
            except Exception:
                return {"response": res_content, "status": status_code}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        try:
            return {"response": json.loads(err_msg), "status": e.code}
        except Exception:
            return {"response": err_msg, "status": e.code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API Request Failed: {str(e)}")


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
    #
    adj = {node["id"]: [] for node in nodes}
    for edge in edges:
        src = edge["source"]
        tgt = edge["target"]
        if src in adj:
            adj[src].append(tgt)


    visited = {node["id"]: 0 for node in nodes}

    def has_cycle(u: str) -> bool:
        visited[u] = 1 
        for v in adj.get(u, []):
            if visited.get(v, 0) == 1:
                return True 
            if visited.get(v, 0) == 0:
                if has_cycle(v):
                    return True
        return False

    for node in nodes:
        node_id = node["id"]
        if visited[node_id] == 0:
            if has_cycle(node_id):
                return False 

    return True 

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
