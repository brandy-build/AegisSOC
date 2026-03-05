"""
AI SOC Platform API Service
"""
from fastapi import FastAPI, WebSocket, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import pymongo, os, pickle, requests, json
from bson import ObjectId
from datetime import datetime

app = FastAPI(title="AI SOC Platform API", version="1.0.0")

# CORS for dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mongo = pymongo.MongoClient(os.getenv('MONGO_URI', 'mongodb://mongodb:27017')).ai_soc
GRAPH_PATH = os.getenv('GRAPH_PATH', '/data/graph.gpickle')
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://ollama:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'mistral')

# Helper to serialize MongoDB documents
def serialize_doc(doc):
    if doc is None:
        return None
    doc['_id'] = str(doc['_id'])
    return doc

class AssistantQuery(BaseModel):
    query: str
    context: Optional[str] = None

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None

# Health check
@app.get('/health')
def health_check():
    return {'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()}

@app.get('/api/alerts')
def get_alerts(limit: int = Query(100, ge=1, le=1000)):
    alerts = list(mongo.alerts.find().sort('timestamp', -1).limit(limit))
    return [serialize_doc(a) for a in alerts]

@app.get('/api/incidents')
def get_incidents(
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = None,
    min_risk: Optional[int] = None
):
    query = {}
    if status:
        query['status'] = status
    if min_risk:
        query['investigation.risk_score'] = {'$gte': min_risk}
    
    incidents = list(mongo.incidents.find(query).sort('timestamp', -1).limit(limit))
    return [serialize_doc(inc) for inc in incidents]

@app.get('/api/incidents/{incident_id}')
def get_incident(incident_id: str):
    try:
        inc = mongo.incidents.find_one({'_id': ObjectId(incident_id)})
        if not inc:
            raise HTTPException(status_code=404, detail="Incident not found")
        return serialize_doc(inc)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.patch('/api/incidents/{incident_id}')
def update_incident(incident_id: str, update: IncidentUpdate):
    try:
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        if update_data:
            update_data['updated_at'] = datetime.utcnow()
            mongo.incidents.update_one(
                {'_id': ObjectId(incident_id)},
                {'$set': update_data}
            )
        return {'success': True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get('/api/graph')
def get_graph():
    try:
        with open(GRAPH_PATH, 'rb') as f:
            G = pickle.load(f)
        nodes = [{'id': n, **G.nodes[n]} for n in G.nodes]
        edges = [{'source': u, 'target': v, **G.edges[u, v]} for u, v in G.edges]
        return {'nodes': nodes, 'edges': edges}
    except FileNotFoundError:
        return {'nodes': [], 'edges': [], 'error': 'Graph not yet built'}
    except Exception as e:
        return JSONResponse({'error': str(e)}, status_code=500)

@app.get('/api/graph/entity/{entity_id}')
def get_entity_graph(entity_id: str, depth: int = Query(2, ge=1, le=5)):
    """Get subgraph around a specific entity"""
    try:
        import networkx as nx
        with open(GRAPH_PATH, 'rb') as f:
            G = pickle.load(f)
        
        if entity_id not in G:
            raise HTTPException(status_code=404, detail="Entity not found in graph")
        
        # Get ego graph (neighbors up to depth)
        subgraph = nx.ego_graph(G, entity_id, radius=depth)
        nodes = [{'id': n, **G.nodes[n]} for n in subgraph.nodes]
        edges = [{'source': u, 'target': v, **G.edges[u, v]} for u, v in subgraph.edges]
        return {'nodes': nodes, 'edges': edges, 'center': entity_id}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Graph not yet built")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/api/stats')
def get_stats():
    total_incidents = mongo.incidents.count_documents({})
    enriched = mongo.incidents.count_documents({'intel': {'$exists': True}})
    investigated = mongo.incidents.count_documents({'investigation': {'$exists': True}})
    
    # Risk distribution
    risk_dist = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
    for inc in mongo.incidents.find({'investigation.risk_score': {'$exists': True}}):
        score = inc.get('investigation', {}).get('risk_score', 0)
        if score >= 80:
            risk_dist['critical'] += 1
        elif score >= 60:
            risk_dist['high'] += 1
        elif score >= 40:
            risk_dist['medium'] += 1
        else:
            risk_dist['low'] += 1
    
    return {
        'total_incidents': total_incidents,
        'enriched_incidents': enriched,
        'investigated_incidents': investigated,
        'risk_distribution': risk_dist,
        'timestamp': datetime.utcnow().isoformat()
    }

@app.get('/api/risks')
def get_risks():
    risks = []
    for inc in mongo.incidents.find():
        risk_score = inc.get('investigation', {}).get('risk_score', 0)
        if risk_score == 0:
            # Calculate basic score if not investigated
            if inc.get('intel'):
                intel = inc['intel']
                if intel.get('abuseipdb', {}).get('data', {}).get('abuseConfidenceScore', 0) > 50:
                    risk_score = 60
                elif intel.get('virustotal', {}).get('data', {}).get('attributes', {}).get('last_analysis_stats', {}).get('malicious', 0) > 0:
                    risk_score = 50
                else:
                    risk_score = 20
        
        risks.append({
            'id': str(inc['_id']),
            'score': risk_score,
            'severity': inc.get('investigation', {}).get('analysis', {}).get('severity', 'unknown'),
            'timestamp': str(inc.get('timestamp', ''))
        })
    return sorted(risks, key=lambda x: x['score'], reverse=True)

@app.get('/api/iocs')
def get_iocs():
    """Get all IOCs across incidents"""
    iocs = {'ip': set(), 'domain': set(), 'hash': set()}
    for inc in mongo.incidents.find({'iocs': {'$exists': True}}):
        for ioc_type, values in inc.get('iocs', {}).items():
            if ioc_type in iocs:
                iocs[ioc_type].update(values)
    return {k: list(v) for k, v in iocs.items()}

@app.get('/api/iocs/{ioc_value}')
def get_ioc_details(ioc_value: str):
    """Get details about a specific IOC"""
    incidents = list(mongo.incidents.find({
        '$or': [
            {'iocs.ip': ioc_value},
            {'iocs.domain': ioc_value},
            {'iocs.hash': ioc_value}
        ]
    }))
    
    if not incidents:
        raise HTTPException(status_code=404, detail="IOC not found")
    
    # Get intel from first incident that has it
    intel = None
    for inc in incidents:
        if inc.get('intel'):
            intel = inc['intel']
            break
    
    return {
        'ioc': ioc_value,
        'incident_count': len(incidents),
        'incident_ids': [str(inc['_id']) for inc in incidents],
        'intel': intel
    }

# SOC Assistant endpoint
@app.post('/api/assistant')
def soc_assistant(query: AssistantQuery):
    """AI-powered SOC Assistant using Ollama"""
    try:
        # Build context from recent incidents
        recent_incidents = list(mongo.incidents.find().sort('timestamp', -1).limit(5))
        
        context = "Recent Security Incidents:\n"
        for inc in recent_incidents:
            alert = inc.get('alert', {})
            investigation = inc.get('investigation', {})
            context += f"- Incident {inc['_id']}: {alert.get('rule', {}).get('description', 'Unknown')} "
            context += f"(Risk: {investigation.get('risk_score', 'N/A')})\n"
        
        if query.context:
            context += f"\nAdditional Context: {query.context}\n"
        
        prompt = f"""You are an expert SOC analyst assistant. Help the analyst with their question.

{context}

Analyst Question: {query.query}

Provide a clear, actionable response. Include specific recommendations if relevant."""
        
        r = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )
        
        if r.status_code == 200:
            response = r.json().get('response', 'No response generated')
            return {'response': response, 'model': OLLAMA_MODEL}
        else:
            return {'response': 'AI assistant temporarily unavailable', 'error': r.status_code}
    except Exception as e:
        return {'response': f'Error: {str(e)}', 'error': True}

# WebSocket for real-time updates
@app.websocket('/ws/updates')
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        # Send initial stats
        stats = get_stats()
        await websocket.send_json({'type': 'stats', 'data': stats})
        
        # Keep connection open for updates
        while True:
            data = await websocket.receive_text()
            if data == 'ping':
                await websocket.send_json({'type': 'pong'})
            elif data == 'stats':
                stats = get_stats()
                await websocket.send_json({'type': 'stats', 'data': stats})
    except Exception:
        pass
    finally:
        await websocket.close()
