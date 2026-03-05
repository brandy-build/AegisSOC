# Building AegisSOC: An AI-Powered Security Operations Center from Scratch

*How I combined Wazuh, Kafka, MongoDB, and Local LLMs to create an intelligent, automated SOC platform*

---

![AegisSOC Dashboard](docs/images/Logo.png)

## Introduction

Every day, Security Operations Centers (SOCs) around the world face an impossible challenge: thousands of security alerts, limited analyst time, and threats that move faster than humans can respond. The average SOC receives over **10,000 alerts daily**, with **95%+ being false positives**. Analysts spend 25+ minutes investigating each alert, leading to burnout, missed threats, and organizational risk.

I asked myself: *What if we could build a SOC that thinks?*

That question led me to build **AegisSOC** — an open-source, AI-powered Security Operations Center that combines real-time threat detection, automated intelligence enrichment, and Large Language Model (LLM) driven investigation. In this article, I'll walk you through the architecture, the technology choices, and the lessons learned building this platform.

---

## The Problem with Traditional SOCs

Before diving into the solution, let's understand why traditional SOCs struggle:

### 1. Alert Fatigue is Real
When everything is urgent, nothing is urgent. Analysts become desensitized to alerts, and critical threats slip through the cracks.

### 2. Context is King (But Hard to Get)
Investigating an alert requires logging into multiple tools — SIEM, threat intel platforms, endpoint solutions. Each context switch costs time and mental energy.

### 3. Institutional Knowledge Walks Out the Door
When experienced analysts leave, their expertise leaves with them. There's no way to capture *how* they investigate threats.

### 4. Static Rules Can't Keep Up
Traditional detection relies on signature-based rules. Attackers evolve; rules don't.

---

## Enter AegisSOC: An Intelligent Security Platform

AegisSOC addresses these challenges through four core capabilities:

```
┌─────────────────────────────────────────────────────────────┐
│                      AegisSOC                               │
├─────────────────────────────────────────────────────────────┤
│  🔍 Real-time Detection    │  Wazuh + Kafka streaming      │
│  🧠 AI Investigation       │  Local LLM (Mistral)          │
│  🌐 Threat Enrichment      │  VirusTotal, AbuseIPDB, OTX   │
│  🕸️ Knowledge Graph        │  Entity relationship mapping  │
└─────────────────────────────────────────────────────────────┘
```

Let me break down each component.

---

## Architecture Deep Dive

### The Big Picture

```
Wazuh Agents → Wazuh Manager → Alert Exporter → Redpanda (Kafka)
                                                      ↓
Dashboard ← API Service ← Investigation Engine ← Detection Engine
                              ↓                       ↓
                         Ollama (LLM)            Intel Engine
                                                      ↓
                                          VirusTotal / AbuseIPDB / OTX
```

### Why These Technology Choices?

#### **Wazuh for Security Event Collection**
Wazuh is an open-source SIEM that provides file integrity monitoring, vulnerability detection, and log analysis. It's the "eyes and ears" of our platform — collecting security events from endpoints, networks, and cloud environments.

*Why not Splunk or Elastic?* Cost and flexibility. Wazuh is free, well-documented, and has an active community. For a project focused on AI/ML experimentation, I didn't want licensing constraints.

#### **Redpanda Instead of Kafka**
Here's a controversial choice: I used Redpanda instead of Apache Kafka.

Redpanda is Kafka-compatible but simpler to operate. No ZooKeeper dependency, lower resource footprint, and it starts in seconds instead of minutes. For a single-node development setup, it's a no-brainer.

```yaml
# That's it. No ZooKeeper. No complex configs.
redpanda:
  image: redpandadata/redpanda:latest
  command:
    - redpanda start
    - --smp 1
    - --memory 512M
```

#### **MongoDB for Flexible Schema**
Security events are messy. An alert from a web server looks nothing like an alert from an endpoint. MongoDB's document model handles this naturally — no schema migrations when your data structure evolves.

#### **Ollama + Mistral: Local LLMs for Privacy**

This is the heart of the project. Instead of sending sensitive security data to OpenAI or Anthropic, I run Mistral 7B locally using Ollama.

**Benefits:**
- **Data stays on-premises** — No sensitive IOCs leaving your network
- **No API costs** — Run as many investigations as you want
- **No rate limits** — Process alerts at your own pace
- **Works offline** — No internet dependency for AI features

```python
def analyze_incident(incident_data, intel_data):
    prompt = f"""You are an expert SOC analyst. Analyze this security incident:

    Incident: {json.dumps(incident_data)}
    Threat Intelligence: {json.dumps(intel_data)}

    Provide:
    1. Summary (2-3 sentences)
    2. Severity (Critical/High/Medium/Low)
    3. Attack vector
    4. Recommended actions (3-5 steps)
    5. Risk score (0-100)
    """
    
    response = requests.post(
        "http://ollama:11434/api/generate",
        json={"model": "mistral", "prompt": prompt}
    )
    return parse_response(response.json())
```

---

## The SOC Assistant: ChatGPT for Security

One of the most powerful features is the SOC Assistant — a conversational AI interface for security queries.

![SOC Assistant Interface](docs/images/soc-assistant.svg)

Analysts can ask natural language questions:
- *"What are the top threats from the last 24 hours?"*
- *"Explain the brute force attacks we're seeing"*
- *"How should I respond to this ransomware indicator?"*

The assistant has context about your environment, your incidents, and your threat intelligence. It's like having a senior analyst available 24/7.

### How It Works

```javascript
// Frontend sends query to backend
const response = await fetch('/api/assistant', {
  method: 'POST',
  body: JSON.stringify({ 
    query: userQuestion,
    context: recentIncidents 
  })
});

// Backend enriches with context and sends to LLM
// LLM responds with actionable analysis
```

---

## Multi-Source Threat Intelligence

An IP address alone tells you nothing. Is it malicious? Who reported it? What campaigns is it associated with?

AegisSOC automatically enriches every indicator with intelligence from three sources:

| Source | What It Provides |
|--------|------------------|
| **VirusTotal** | Malware detection ratios, community scores |
| **AbuseIPDB** | Abuse reports, confidence scores |
| **AlienVault OTX** | Threat pulses, related indicators |

```python
async def enrich_ip(ip_address):
    results = await asyncio.gather(
        query_virustotal(ip_address),
        query_abuseipdb(ip_address),
        query_alienvault(ip_address)
    )
    
    # Combine and score
    return {
        "ip": ip_address,
        "virustotal": results[0],
        "abuseipdb": results[1],
        "alienvault": results[2],
        "consensus_score": calculate_consensus(results)
    }
```

The **consensus scoring** is key. If all three sources flag an IP as malicious, you can be confident it's a real threat. If only one flags it, maybe investigate further before blocking.

---

## Knowledge Graph: Seeing the Unseen

Security incidents don't exist in isolation. The IP that scanned your network yesterday might be the same one attempting SQL injection today. The malware hash on one endpoint might match command-and-control traffic from another.

AegisSOC builds a **knowledge graph** that maps relationships:

![Attack Graph Visualization](docs/images/attack-graph.svg)

- Incidents connect to IPs
- IPs connect to domains
- Domains connect to file hashes
- Hashes connect to users and hosts

When you investigate one node, you see its entire neighborhood. Suddenly, scattered alerts become a coherent attack story.

### Implementation with NetworkX

```python
import networkx as nx

graph = nx.Graph()

# Add incident node
graph.add_node(incident_id, type="incident", severity="high")

# Add IOC nodes and edges
for ioc in incident["iocs"]:
    graph.add_node(ioc["value"], type=ioc["type"])
    graph.add_edge(incident_id, ioc["value"], relationship="contains")

# Find related incidents
related = list(nx.neighbors(graph, suspicious_ip))
```

---

## MITRE ATT&CK Mapping

Every detection maps to MITRE ATT&CK — the industry-standard framework for understanding adversary behavior.

![MITRE ATT&CK Matrix](docs/images/mitre-mapping.svg)

This isn't just for compliance. When you see which techniques attackers are actually using against your environment, you can:
- Prioritize detection engineering efforts
- Identify gaps in your coverage
- Communicate risk to leadership in a common language

---

## The Dashboard: Single Pane of Glass

All of this comes together in a React/Next.js dashboard:

![Dashboard Preview](docs/images/dashboard-preview.svg)

**Key Components:**
- **Status Cards** — KPIs at a glance (total incidents, critical alerts, enrichment rate)
- **Alert Stream** — Real-time feed with severity filtering
- **Risk Heatmap** — Which incidents need attention NOW
- **Attack Graph** — Interactive visualization of entity relationships
- **SOC Assistant** — AI chat interface

### Real-Time Updates

The dashboard polls the API every 10 seconds. For most SOC use cases, this provides a good balance between freshness and server load. (Future enhancement: WebSocket for true real-time streaming.)

---

## Lessons Learned

### 1. Start with Data Flow, Not UI

I spent my first week designing the dashboard. Mistake. I should have started with: *How does data get from Wazuh to something I can query?*

Once the pipeline was solid, the UI came together quickly.

### 2. Local LLMs Are Good Enough

I was skeptical that a 7B parameter model could match GPT-4 for security analysis. For 90% of use cases, Mistral is excellent. The key is good prompt engineering and providing sufficient context.

### 3. Schema Flexibility > Rigid Structure

Every time I thought "I'll just add this field to the database," MongoDB made it painless. SQL would have required migrations and downtime.

### 4. Docker Compose is Underrated

For a project with 8+ services, Docker Compose is magic. One `docker-compose up -d` and everything works. The dependency ordering (`depends_on`) ensures services start in the right sequence.

---

## Try It Yourself

AegisSOC is open source and available on GitHub:

🔗 **[github.com/brandy-build/AegisSOC](https://github.com/brandy-build/AegisSOC)**

### Quick Start

```bash
# Clone the repository
git clone https://github.com/brandy-build/AegisSOC.git
cd AegisSOC

# Configure environment
cp config/.env.example infrastructure/.env
# Edit infrastructure/.env with your API keys

# Start all services
cd infrastructure
docker-compose up -d

# Pull the LLM model
docker exec -it ollama ollama pull mistral

# Access dashboard
open http://localhost:3000
```

### What You'll Need
- Docker & Docker Compose
- ~8GB RAM (for the LLM)
- Optional: Threat intel API keys (free tiers available)

---

## What's Next?

AegisSOC is a foundation. Here's what I'm planning:

**Short Term:**
- SOAR integration (automated response playbooks)
- User authentication (OAuth2/SAML)
- Slack/Teams notifications

**Medium Term:**
- Multi-tenancy for managed security providers
- Case management for investigation workflows
- Custom Sigma rule support

**Long Term:**
- Behavioral anomaly detection with ML
- Automated remediation actions
- Federated threat intelligence sharing

---

## Conclusion

Building AegisSOC taught me that the future of security operations isn't about more alerts — it's about **smarter processing** of the alerts we already have.

By combining:
- **Open-source SIEM** (Wazuh) for collection
- **Stream processing** (Redpanda) for real-time ingestion
- **Local LLMs** (Ollama/Mistral) for AI analysis
- **Multi-source threat intel** for context
- **Knowledge graphs** for relationship discovery

...we can build SOC platforms that actually help analysts instead of burying them.

The best part? This entire stack is open source. No six-figure Splunk license. No vendor lock-in. Just good tools, well integrated.

If you're building something similar, I'd love to hear about it. And if you try AegisSOC, please open issues and PRs — the project is better with community input.

---

**Connect with me:**
- GitHub: [@brandy-build](https://github.com/brandy-build)
- Project: [AegisSOC](https://github.com/brandy-build/AegisSOC)

---

*Tags: #cybersecurity #AI #LLM #SOC #opensource #python #react #docker*

---

## Appendix: Full Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js, React | Dashboard UI |
| API | FastAPI | REST endpoints |
| Streaming | Redpanda | Kafka-compatible messaging |
| Database | MongoDB | Document storage |
| AI/LLM | Ollama, Mistral 7B | Local AI inference |
| Graph | NetworkX | Knowledge graph |
| SIEM | Wazuh | Security event collection |
| Threat Intel | VirusTotal, AbuseIPDB, OTX | IOC enrichment |
| Container | Docker Compose | Orchestration |

---

*Thanks for reading! If this article was helpful, please give it a clap 👏 and follow for more security engineering content.*
