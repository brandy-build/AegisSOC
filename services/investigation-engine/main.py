"""
AI Investigation Engine - Uses Ollama LLM to analyze security incidents
"""
import requests, pymongo, os, time, json

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://mongodb:27017')
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://ollama:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'mistral')

mongo = pymongo.MongoClient(MONGO_URI).ai_soc

INVESTIGATION_PROMPT = """You are an expert SOC analyst. Analyze this security incident and provide:
1. SUMMARY: Brief 2-3 sentence summary of the incident
2. SEVERITY: Critical/High/Medium/Low with justification
3. ATTACK_VECTOR: Likely attack method
4. RECOMMENDATIONS: 3-5 specific remediation steps
5. IOCS_ANALYSIS: Assessment of the indicators of compromise

Incident Data:
{incident_data}

Threat Intelligence:
{intel_data}

Respond in JSON format with keys: summary, severity, severity_reason, attack_vector, recommendations (array), iocs_analysis
"""

def wait_for_ollama():
    """Wait for Ollama to be ready"""
    print(f"Waiting for Ollama at {OLLAMA_BASE_URL}...")
    for _ in range(60):
        try:
            r = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
            if r.status_code == 200:
                print("Ollama is ready")
                return True
        except:
            pass
        time.sleep(5)
    print("Ollama not available after timeout")
    return False

def ensure_model():
    """Ensure the model is available, pull if needed"""
    try:
        r = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10)
        if r.status_code == 200:
            models = [m['name'] for m in r.json().get('models', [])]
            if OLLAMA_MODEL in models or f"{OLLAMA_MODEL}:latest" in models:
                print(f"Model {OLLAMA_MODEL} is available")
                return True
        
        print(f"Pulling model {OLLAMA_MODEL}...")
        r = requests.post(f"{OLLAMA_BASE_URL}/api/pull", json={"name": OLLAMA_MODEL}, timeout=600, stream=True)
        for line in r.iter_lines():
            if line:
                status = json.loads(line).get('status', '')
                if 'pulling' in status or 'downloading' in status:
                    print(f"  {status}")
        print(f"Model {OLLAMA_MODEL} ready")
        return True
    except Exception as e:
        print(f"Error ensuring model: {e}")
        return False

def analyze_incident(incident):
    """Use Ollama to analyze an incident"""
    alert = incident.get('alert', {})
    intel = incident.get('intel', {})
    iocs = incident.get('iocs', {})
    
    incident_data = {
        'timestamp': str(alert.get('timestamp', 'unknown')),
        'source_ip': alert.get('src_ip', 'unknown'),
        'dest_ip': alert.get('dest_ip', 'unknown'),
        'rule_level': alert.get('rule', {}).get('level', 0),
        'rule_description': alert.get('rule', {}).get('description', 'unknown'),
        'agent': alert.get('agent', {}).get('name', 'unknown'),
        'user': alert.get('user', 'unknown'),
        'iocs': iocs
    }
    
    # Simplify intel data for prompt
    intel_summary = {}
    if intel.get('virustotal', {}).get('data'):
        vt_data = intel['virustotal']['data'].get('attributes', {})
        stats = vt_data.get('last_analysis_stats', {})
        intel_summary['virustotal'] = {
            'malicious': stats.get('malicious', 0),
            'suspicious': stats.get('suspicious', 0),
            'harmless': stats.get('harmless', 0)
        }
    if intel.get('abuseipdb', {}).get('data'):
        abuse_data = intel['abuseipdb']['data']
        intel_summary['abuseipdb'] = {
            'abuse_confidence_score': abuse_data.get('abuseConfidenceScore', 0),
            'total_reports': abuse_data.get('totalReports', 0),
            'is_public': abuse_data.get('isPublic', False)
        }
    if intel.get('alienvault_otx', {}):
        otx = intel['alienvault_otx']
        intel_summary['alienvault_otx'] = {
            'pulse_count': otx.get('pulse_info', {}).get('count', 0),
            'reputation': otx.get('reputation', 0)
        }
    
    prompt = INVESTIGATION_PROMPT.format(
        incident_data=json.dumps(incident_data, indent=2),
        intel_data=json.dumps(intel_summary, indent=2)
    )
    
    try:
        r = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            },
            timeout=120
        )
        if r.status_code == 200:
            response = r.json().get('response', '{}')
            try:
                analysis = json.loads(response)
                return analysis
            except json.JSONDecodeError:
                return {'raw_response': response, 'parse_error': True}
        else:
            print(f"Ollama API error: {r.status_code}")
            return None
    except Exception as e:
        print(f"Error analyzing incident: {e}")
        return None

def calculate_risk_score(incident, analysis):
    """Calculate a risk score based on incident data and AI analysis"""
    score = 0
    
    # Base score from rule level
    alert = incident.get('alert', {})
    rule_level = alert.get('rule', {}).get('level', 0)
    score += rule_level * 5  # 0-75 points
    
    # Intel-based scoring
    intel = incident.get('intel', {})
    if intel.get('virustotal', {}).get('data'):
        stats = intel['virustotal']['data'].get('attributes', {}).get('last_analysis_stats', {})
        score += stats.get('malicious', 0) * 2
        score += stats.get('suspicious', 0)
    
    if intel.get('abuseipdb', {}).get('data'):
        abuse_score = intel['abuseipdb']['data'].get('abuseConfidenceScore', 0)
        score += abuse_score / 2
    
    # AI severity adjustment
    if analysis:
        severity = analysis.get('severity', '').lower()
        if 'critical' in severity:
            score += 30
        elif 'high' in severity:
            score += 20
        elif 'medium' in severity:
            score += 10
    
    # Cap at 100
    return min(100, int(score))

def investigate_incidents():
    """Main loop to investigate incidents"""
    print(f"Investigation engine started. Model: {OLLAMA_MODEL}, Ollama: {OLLAMA_BASE_URL}")
    
    if not wait_for_ollama():
        print("Cannot start without Ollama. Exiting.")
        return
    
    if not ensure_model():
        print("Cannot ensure model availability. Will retry later.")
    
    while True:
        # Find incidents with intel but no investigation
        query = {
            'intel': {'$exists': True},
            'investigation': {'$exists': False}
        }
        
        for incident in mongo.incidents.find(query):
            incident_id = incident['_id']
            print(f"Investigating incident {incident_id}...")
            
            analysis = analyze_incident(incident)
            if analysis:
                risk_score = calculate_risk_score(incident, analysis)
                investigation = {
                    'analysis': analysis,
                    'risk_score': risk_score,
                    'model': OLLAMA_MODEL,
                    'investigated_at': time.time()
                }
                mongo.incidents.update_one(
                    {'_id': incident_id},
                    {'$set': {'investigation': investigation}}
                )
                print(f"Incident {incident_id} investigated. Risk score: {risk_score}")
            else:
                print(f"Failed to analyze incident {incident_id}")
            
            time.sleep(2)  # Rate limit
        
        time.sleep(15)  # Check for new incidents

if __name__ == "__main__":
    investigate_incidents()
