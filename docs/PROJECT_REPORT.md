# AI SOC Platform - Technical Project Report

**Project Title:** AI-Powered Security Operations Center Platform  
**Document Version:** 1.0  
**Date:** March 5, 2026  
**Author:** SOC Engineering Team  

---

## Executive Summary

The AI SOC Platform is a production-grade, AI-powered Security Operations Center solution designed to modernize threat detection, incident response, and security analytics. By combining real-time stream processing, multi-source threat intelligence enrichment, and Large Language Model (LLM) powered investigation capabilities, this platform addresses the critical challenges facing modern security operations teams: alert fatigue, manual investigation overhead, and disparate security tooling.

This report provides a comprehensive overview of the project's purpose, technical architecture, tool selection rationale, and configuration details.

---

## Table of Contents

1. [Project Purpose & Objectives](#1-project-purpose--objectives)
2. [Problem Statement](#2-problem-statement)
3. [Solution Architecture](#3-solution-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Tools & Services](#5-tools--services)
6. [Configuration Details](#6-configuration-details)
7. [Design Decisions & Rationale](#7-design-decisions--rationale)
8. [Integration Points](#8-integration-points)
9. [Security Considerations](#9-security-considerations)
10. [Future Enhancements](#10-future-enhancements)
11. [Conclusion](#11-conclusion)

---

## 1. Project Purpose & Objectives

### 1.1 Core Purpose

The AI SOC Platform was developed to create an intelligent, automated security operations center that:

- **Reduces Mean Time to Detect (MTTD)**: Automated alert processing and correlation significantly reduces the time between threat occurrence and detection.
- **Reduces Mean Time to Respond (MTTR)**: AI-driven investigation recommendations accelerate incident response.
- **Eliminates Alert Fatigue**: Intelligent prioritization and risk scoring help analysts focus on genuine threats.
- **Democratizes Threat Intelligence**: Automatic enrichment from multiple sources provides context without manual lookups.
- **Enables Knowledge Discovery**: Graph-based visualization reveals hidden relationships between security entities.

### 1.2 Project Objectives

| Objective | Description | Success Metric |
|-----------|-------------|----------------|
| **Real-time Processing** | Process security alerts within seconds of generation | < 5 second latency |
| **Automated Enrichment** | Enrich 100% of incidents with threat intelligence | 95%+ enrichment rate |
| **AI Investigation** | Provide actionable recommendations for all incidents | All incidents analyzed |
| **Unified Dashboard** | Single pane of glass for all security data | 100% data visibility |
| **Scalable Architecture** | Handle enterprise-scale alert volumes | 10,000+ alerts/day |

### 1.3 Target Users

- **SOC Analysts (Tier 1-3)**: Primary users for daily security operations
- **Security Engineers**: Platform administrators and integration developers
- **Incident Response Teams**: Investigation and remediation workflows
- **Security Leadership**: Executive dashboards and reporting

---

## 2. Problem Statement

### 2.1 Challenges in Modern SOC Operations

Modern Security Operations Centers face several critical challenges:

#### Alert Fatigue
- Average SOC receives **10,000+ alerts daily**
- **95%+ are false positives** or low-priority
- Analysts spend **25+ minutes** per alert investigation
- Critical alerts often missed due to volume

#### Manual Investigation Overhead
- Context gathering requires **multiple tool logins**
- Threat intelligence lookups are **time-consuming**
- Institutional knowledge **not easily accessible**
- Repetitive tasks lead to **analyst burnout**

#### Siloed Security Tools
- SIEM, EDR, threat intel platforms operate **independently**
- No unified view of security posture
- **Correlation requires manual effort**
- Incident response is **fragmented**

#### Lack of AI/ML Integration
- Most SOC tools use **static rule-based detection**
- No natural language interface for queries
- **No automated reasoning** about threats
- Limited predictive capabilities

### 2.2 How This Platform Addresses These Challenges

| Challenge | Platform Solution |
|-----------|-------------------|
| Alert Fatigue | Automated risk scoring and prioritization |
| Manual Investigation | LLM-powered analysis with recommendations |
| Siloed Tools | Unified dashboard with integrated data sources |
| Static Detection | AI-driven correlation and pattern recognition |
| Context Gathering | Automatic multi-source threat intel enrichment |
| Knowledge Sharing | Knowledge graph capturing entity relationships |

---

## 3. Solution Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AI SOC Platform                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   DATA INGESTION LAYER                                                          │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                     │
│   │   Wazuh      │    │    Alert     │    │  Redpanda    │                     │
│   │   Manager    │───▶│   Exporter   │───▶│   (Kafka)    │                     │
│   └──────────────┘    └──────────────┘    └──────────────┘                     │
│                                                  │                              │
│   PROCESSING LAYER                               ▼                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                     │
│   │  Detection   │◀───│  Redpanda    │    │   MongoDB    │                     │
│   │   Engine     │    │  Consumer    │───▶│   (Storage)  │                     │
│   └──────┬───────┘    └──────────────┘    └──────────────┘                     │
│          │                                       ▲                              │
│   ENRICHMENT LAYER                               │                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────┴───────┐                     │
│   │    Intel     │───▶│    Graph     │───▶│ Investigation│                     │
│   │   Engine     │    │   Engine     │    │    Engine    │                     │
│   └──────────────┘    └──────────────┘    └──────────────┘                     │
│          │                   │                   │                              │
│          │                   │          ┌───────┴───────┐                      │
│          │                   │          │    Ollama     │                      │
│          │                   │          │  (Mistral AI) │                      │
│          │                   │          └───────────────┘                      │
│   API LAYER                  │                                                  │
│   ┌──────────────────────────┴──────────────────────────────┐                  │
│   │                   FastAPI Service                        │                  │
│   │   REST Endpoints │ WebSocket │ SOC Assistant API        │                  │
│   └─────────────────────────────┬────────────────────────────┘                  │
│                                 │                                               │
│   PRESENTATION LAYER            ▼                                               │
│   ┌─────────────────────────────────────────────────────────┐                  │
│   │                Next.js / React Dashboard                 │                  │
│   │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│                  │
│   │  │ Status │ │ Alerts │ │ Graph  │ │ MITRE  │ │   AI   ││                  │
│   │  │ Cards  │ │ Stream │ │  Viz   │ │ Matrix │ │ Assist ││                  │
│   │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘│                  │
│   └─────────────────────────────────────────────────────────┘                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
1. Security Event Generation
   Wazuh Agent → Wazuh Manager → alerts.json

2. Alert Streaming
   Alert Exporter → Redpanda Topic (wazuh-alerts)

3. Alert Processing
   Detection Engine consumes → Extracts IOCs → Creates Incident → MongoDB

4. Threat Intelligence Enrichment
   Intel Engine queries → VirusTotal, AbuseIPDB, AlienVault OTX → Updates Incident

5. AI Investigation
   Investigation Engine → Ollama (Mistral) → Analysis & Recommendations → Updates Incident

6. Knowledge Graph Building
   Graph Engine → NetworkX → Entity Relationships → Graph Storage

7. API Serving
   FastAPI → REST/WebSocket → Dashboard Components

8. Visualization
   React Components → Real-time Updates → User Interface
```

### 3.3 Microservices Architecture

The platform follows a microservices architecture with the following principles:

- **Single Responsibility**: Each service handles one specific function
- **Loose Coupling**: Services communicate via APIs and message queues
- **Independent Deployment**: Services can be updated without affecting others
- **Containerization**: All services run in Docker containers
- **Orchestration**: Docker Compose manages service lifecycle

---

## 4. Technology Stack

### 4.1 Complete Technology Stack Overview

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 14.x | React framework with SSR |
| **Frontend** | React | 18.x | UI component library |
| **Frontend** | Chart.js | 4.x | Data visualization charts |
| **Frontend** | Canvas API | Native | Custom graph rendering |
| **Backend API** | FastAPI | 0.100+ | High-performance REST API |
| **Backend API** | Uvicorn | 0.23+ | ASGI server |
| **Backend API** | WebSocket | Native | Real-time updates |
| **Streaming** | Redpanda | Latest | Kafka-compatible streaming |
| **Database** | MongoDB | 7.x | Document storage |
| **AI/LLM** | Ollama | Latest | Local LLM runtime |
| **AI/LLM** | Mistral | 7B | Large Language Model |
| **Graph** | NetworkX | 3.x | Graph data structure |
| **SIEM** | Wazuh | 4.x | Security event collection |
| **Languages** | Python | 3.9+ | Backend services |
| **Languages** | JavaScript/JSX | ES6+ | Frontend development |
| **Container** | Docker | 24.x | Containerization |
| **Orchestration** | Docker Compose | 2.x | Multi-container management |

### 4.2 Technology Stack Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION TIER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Next.js    │  │   React     │  │      Chart.js           │  │
│  │  Framework  │  │   18.x      │  │      Canvas API         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      API TIER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  FastAPI    │  │  Uvicorn    │  │    WebSocket            │  │
│  │  (Python)   │  │  (ASGI)     │  │    (Real-time)          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    PROCESSING TIER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Detection  │  │   Intel     │  │   Investigation         │  │
│  │  Engine     │  │   Engine    │  │   Engine                │  │
│  │  (Python)   │  │   (Python)  │  │   (Python + Ollama)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │   Graph     │  │   Alert     │                               │
│  │   Engine    │  │   Exporter  │                               │
│  │  (NetworkX) │  │   (Python)  │                               │
│  └─────────────┘  └─────────────┘                               │
├─────────────────────────────────────────────────────────────────┤
│                      DATA TIER                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  MongoDB    │  │  Redpanda   │  │      Ollama             │  │
│  │  (NoSQL)    │  │  (Kafka)    │  │     (LLM Runtime)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                   SECURITY DATA SOURCE                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      Wazuh SIEM                              ││
│  │   Manager │ Agents │ Rules │ Decoders │ Alert Generation    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Tools & Services

### 5.1 Security Event Collection

#### Wazuh SIEM
| Attribute | Details |
|-----------|---------|
| **Purpose** | Security event collection, intrusion detection, compliance monitoring |
| **Components** | Wazuh Manager, Wazuh Agents, Wazuh Indexer, Wazuh Dashboard |
| **Why Chosen** | Open-source, comprehensive SIEM capabilities, active community |
| **Integration** | Alert JSON output consumed by Alert Exporter |
| **Key Features** | File integrity monitoring, vulnerability detection, log analysis |

### 5.2 Message Streaming

#### Redpanda (Kafka-Compatible)
| Attribute | Details |
|-----------|---------|
| **Purpose** | Real-time event streaming and message queue |
| **Port** | 9092 (Kafka API), 8081 (Schema Registry), 9644 (Admin) |
| **Why Chosen** | Kafka-compatible, simpler operations, lower resource usage |
| **Topic** | `wazuh-alerts` |
| **Key Features** | High throughput, low latency, no ZooKeeper dependency |

**Configuration:**
```yaml
redpanda:
  image: redpandadata/redpanda:latest
  command:
    - redpanda start
    - --smp 1
    - --memory 512M
    - --overprovisioned
    - --kafka-addr PLAINTEXT://0.0.0.0:9092
```

**Rationale:** Redpanda was chosen over Apache Kafka for its simpler deployment model, elimination of ZooKeeper dependency, and better performance on single-node configurations while maintaining full Kafka API compatibility.

### 5.3 Database

#### MongoDB
| Attribute | Details |
|-----------|---------|
| **Purpose** | Primary data store for incidents, IOCs, and enrichment data |
| **Port** | 27017 |
| **Database** | `ai_soc` |
| **Collections** | `incidents`, `iocs`, `alerts`, `graph_data` |
| **Why Chosen** | Flexible schema, JSON-native, excellent for security event data |

**Configuration:**
```yaml
mongodb:
  image: mongo:latest
  ports:
    - "27017:27017"
  volumes:
    - ./config/mongo:/data/db
```

**Rationale:** MongoDB's document model perfectly matches the semi-structured nature of security events. Each incident can have varying IOC types, enrichment data, and investigation results without schema migrations.

### 5.4 AI/LLM Infrastructure

#### Ollama
| Attribute | Details |
|-----------|---------|
| **Purpose** | Local LLM runtime for AI-powered investigation |
| **Port** | 11434 |
| **Model** | Mistral 7B |
| **Why Chosen** | Local deployment, privacy-preserving, no API costs |
| **Key Features** | GPU acceleration, model hot-swapping, REST API |

**Configuration:**
```yaml
ollama:
  image: ollama/ollama:latest
  ports:
    - "11434:11434"
  volumes:
    - ollama-data:/root/.ollama
```

#### Mistral AI Model
| Attribute | Details |
|-----------|---------|
| **Model** | Mistral 7B Instruct |
| **Parameters** | 7 billion |
| **Context** | 8K tokens |
| **Why Chosen** | Excellent reasoning, efficient size, open weights |
| **Use Cases** | Incident analysis, threat assessment, recommendations |

**Rationale:** Running LLMs locally via Ollama provides several advantages:
1. **Data Privacy**: Sensitive security data never leaves the network
2. **Cost Efficiency**: No per-token API costs
3. **Availability**: No dependency on external services
4. **Customization**: Can fine-tune models for security domain

### 5.5 Threat Intelligence APIs

#### VirusTotal
| Attribute | Details |
|-----------|---------|
| **Purpose** | Malware analysis, IP/domain/file reputation |
| **API Version** | v3 |
| **Rate Limit** | 4 requests/minute (free tier) |
| **Data Retrieved** | Detection ratios, malware categories, community scores |

#### AbuseIPDB
| Attribute | Details |
|-----------|---------|
| **Purpose** | IP address abuse reporting and reputation |
| **API Version** | v2 |
| **Rate Limit** | 1,000 checks/day (free tier) |
| **Data Retrieved** | Abuse confidence score, total reports, categories |

#### AlienVault OTX
| Attribute | Details |
|-----------|---------|
| **Purpose** | Open threat intelligence exchange |
| **API Version** | v1 |
| **Rate Limit** | 10,000 requests/day |
| **Data Retrieved** | Pulses, indicators, related tags, first/last seen |

**Rationale for Multiple Sources:** Using three threat intelligence providers ensures:
1. **Cross-validation**: Reduces false positives through consensus
2. **Coverage**: Different sources have different visibility
3. **Redundancy**: Service outages don't halt enrichment

### 5.6 Backend Services

#### FastAPI (API Service)
| Attribute | Details |
|-----------|---------|
| **Purpose** | REST API gateway for all platform data |
| **Port** | 8001 (external), 8000 (internal) |
| **Why Chosen** | High performance, automatic OpenAPI docs, async support |
| **Key Endpoints** | `/api/stats`, `/api/incidents`, `/api/graph`, `/api/assistant` |

#### Detection Engine
| Attribute | Details |
|-----------|---------|
| **Purpose** | Alert consumption, IOC extraction, incident creation |
| **Language** | Python 3.9+ |
| **Libraries** | kafka-python, pymongo, regex |
| **IOC Types** | IP addresses, domains, file hashes (MD5, SHA1, SHA256), URLs |

#### Intel Engine
| Attribute | Details |
|-----------|---------|
| **Purpose** | Threat intelligence enrichment |
| **Language** | Python 3.9+ |
| **Libraries** | requests, pymongo |
| **Integrations** | VirusTotal, AbuseIPDB, AlienVault OTX |

#### Investigation Engine
| Attribute | Details |
|-----------|---------|
| **Purpose** | AI-powered incident analysis |
| **Language** | Python 3.9+ |
| **Libraries** | requests (Ollama API), pymongo |
| **Output** | Summary, severity, attack vector, recommendations, risk score |

#### Graph Engine
| Attribute | Details |
|-----------|---------|
| **Purpose** | Knowledge graph construction and queries |
| **Language** | Python 3.9+ |
| **Libraries** | NetworkX, pymongo |
| **Node Types** | Incident, IP, Domain, Hash, User, Host, Rule |

### 5.7 Frontend

#### Next.js Dashboard
| Attribute | Details |
|-----------|---------|
| **Purpose** | SOC analyst user interface |
| **Port** | 3000 |
| **Framework** | Next.js 14 with React 18 |
| **Styling** | CSS-in-JS (styled-jsx) |
| **Components** | 8 custom React components |

**Dashboard Components:**

| Component | Purpose |
|-----------|---------|
| `StatusCards.js` | KPI metrics display |
| `AlertStream.js` | Real-time alert table with filters |
| `IncidentTimeline.js` | Chronological incident view |
| `RiskHeatmap.js` | Risk score bar chart |
| `AttackGraph.js` | Canvas-based knowledge graph |
| `MitreMapping.js` | MITRE ATT&CK matrix visualization |
| `IOCExplorer.js` | IOC search and browse interface |
| `SOCAssistant.js` | AI chat interface |

---

## 6. Configuration Details

### 6.1 Docker Compose Configuration

The platform uses Docker Compose for orchestration with the following service definitions:

```yaml
version: '3.8'
services:
  # Message Streaming
  redpanda:
    image: redpandadata/redpanda:latest
    ports:
      - "9092:9092"   # Kafka API
      - "8081:8081"   # Schema Registry
      - "9644:9644"   # Admin API
    command:
      - redpanda start
      - --smp 1
      - --memory 512M
      - --overprovisioned
      - --node-id 0
      - --kafka-addr PLAINTEXT://0.0.0.0:9092
      - --advertise-kafka-addr PLAINTEXT://redpanda:9092

  # Database
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - ./config/mongo:/data/db

  # LLM Runtime
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama

  # Processing Services
  detection-engine:
    build: ../services/detection-engine
    environment:
      - KAFKA_TOPIC=wazuh-alerts
      - KAFKA_SERVERS=redpanda:9092
      - MONGO_URI=mongodb://mongodb:27017
    depends_on:
      - redpanda
      - mongodb

  intel-engine:
    build: ../services/intel-engine
    environment:
      - MONGO_URI=mongodb://mongodb:27017
      - VIRUSTOTAL_API_KEY=${VIRUSTOTAL_API_KEY}
      - ABUSEIPDB_API_KEY=${ABUSEIPDB_API_KEY}
      - ALIENVAULT_OTX_API_KEY=${ALIENVAULT_OTX_API_KEY}
    depends_on:
      - mongodb

  investigation-engine:
    build: ../services/investigation-engine
    environment:
      - MONGO_URI=mongodb://mongodb:27017
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_MODEL=mistral
    depends_on:
      - mongodb
      - ollama

  graph-engine:
    build: ../services/graph-engine
    environment:
      - MONGO_URI=mongodb://mongodb:27017
      - GRAPH_PATH=/data/graph.gpickle
    volumes:
      - graph-data:/data
    depends_on:
      - mongodb

  api-service:
    build: ../services/api-service
    environment:
      - MONGO_URI=mongodb://mongodb:27017
      - GRAPH_PATH=/data/graph.gpickle
      - OLLAMA_BASE_URL=http://ollama:11434
    ports:
      - "8001:8000"
    depends_on:
      - mongodb

  dashboard:
    build: ../dashboard
    environment:
      - API_URL=http://api-service:8000
    ports:
      - "3000:3000"
    depends_on:
      - api-service
```

### 6.2 Environment Variables

| Variable | Service | Description | Required |
|----------|---------|-------------|----------|
| `VIRUSTOTAL_API_KEY` | intel-engine | VirusTotal API authentication | Optional |
| `ABUSEIPDB_API_KEY` | intel-engine | AbuseIPDB API authentication | Optional |
| `ALIENVAULT_OTX_API_KEY` | intel-engine | AlienVault OTX API authentication | Optional |
| `MONGO_URI` | All services | MongoDB connection string | Yes |
| `KAFKA_SERVERS` | detection-engine | Redpanda bootstrap servers | Yes |
| `KAFKA_TOPIC` | detection-engine | Alert topic name | Yes |
| `OLLAMA_BASE_URL` | investigation-engine | Ollama API endpoint | Yes |
| `OLLAMA_MODEL` | investigation-engine | LLM model name | Yes |
| `GRAPH_PATH` | graph-engine, api-service | Graph file location | Yes |
| `API_URL` | dashboard | Backend API URL | Yes |

### 6.3 Network Configuration

```yaml
networks:
  default:
    driver: bridge

# All services communicate via Docker's internal DNS
# Service names resolve to container IPs automatically
```

### 6.4 Volume Configuration

```yaml
volumes:
  graph-data:           # Persistent graph storage
  ollama-data:          # LLM model storage
  wazuh-logs:           # Wazuh alert logs (external)
    external: true
    name: single-node_wazuh_logs
```

### 6.5 Port Mappings

| Port | Service | Protocol | Purpose |
|------|---------|----------|---------|
| 3000 | Dashboard | HTTP | Web UI |
| 8001 | API Service | HTTP | REST API |
| 8080 | Redpanda Console | HTTP | Kafka management UI |
| 9092 | Redpanda | TCP | Kafka protocol |
| 11434 | Ollama | HTTP | LLM API |
| 27017 | MongoDB | TCP | Database |

---

## 7. Design Decisions & Rationale

### 7.1 Microservices Over Monolith

**Decision:** Implement the platform as independent microservices rather than a monolithic application.

**Rationale:**
- **Scalability**: Individual services can be scaled based on demand
- **Fault Isolation**: Service failures don't cascade
- **Technology Flexibility**: Each service can use optimal tools
- **Development Velocity**: Teams can work independently
- **Deployment Agility**: Services can be updated without full redeploy

### 7.2 Redpanda Over Apache Kafka

**Decision:** Use Redpanda instead of traditional Apache Kafka.

**Rationale:**
- **Simpler Operations**: No ZooKeeper dependency
- **Resource Efficiency**: Lower memory and CPU footprint
- **Performance**: Better latency on single-node deployments
- **Compatibility**: 100% Kafka API compatible
- **Developer Experience**: Faster startup, easier debugging

### 7.3 MongoDB Over PostgreSQL

**Decision:** Use MongoDB as the primary database.

**Rationale:**
- **Schema Flexibility**: Security events have variable structures
- **JSON Native**: Alerts are already JSON format
- **Nested Data**: IOCs, enrichment, and investigation data nest naturally
- **Horizontal Scaling**: Built-in sharding for future growth
- **Query Flexibility**: Rich query language for security analysis

### 7.4 Local LLM Over Cloud APIs

**Decision:** Run Mistral locally via Ollama instead of using OpenAI/Anthropic APIs.

**Rationale:**
- **Data Security**: Sensitive security data stays on-premises
- **Cost Control**: No per-token API costs
- **Availability**: No internet dependency for AI features
- **Latency**: Local inference eliminates network round-trips
- **Compliance**: Meets data residency requirements

### 7.5 Canvas-Based Graph Over D3.js/Cytoscape

**Decision:** Implement custom Canvas-based graph visualization instead of using libraries.

**Rationale:**
- **Performance**: Canvas handles thousands of nodes efficiently
- **Customization**: Full control over visual representation
- **Bundle Size**: No heavy external dependencies
- **Animation**: Smooth force-directed layout physics
- **Integration**: Direct integration with React lifecycle

### 7.6 Next.js Over Create React App

**Decision:** Use Next.js as the React framework.

**Rationale:**
- **Server-Side Rendering**: Faster initial page loads
- **API Routes**: Built-in backend capabilities if needed
- **Optimization**: Automatic code splitting and optimization
- **Developer Experience**: Hot reload, TypeScript support
- **Production Ready**: Built-in production optimizations

### 7.7 Multiple Threat Intelligence Sources

**Decision:** Integrate three threat intelligence providers.

**Rationale:**
- **Accuracy**: Cross-validation reduces false positives
- **Coverage**: Different providers see different threats
- **Redundancy**: No single point of failure
- **Confidence Scoring**: Multiple sources improve risk assessment
- **Cost Optimization**: Mix of free and paid tiers

---

## 8. Integration Points

### 8.1 Wazuh Integration

```
Wazuh Manager
    │
    ├── /var/ossec/logs/alerts/alerts.json
    │       │
    │       └── Alert Exporter (File Watch)
    │               │
    │               └── Redpanda Topic: wazuh-alerts
```

**Integration Method:** File-based alert consumption from Wazuh's JSON alert log.

**Why This Approach:**
- Non-invasive to Wazuh operation
- No modification of Wazuh configuration
- Reliable (file system is persistent)
- Simple recovery (replay from file)

### 8.2 Threat Intelligence Integration

```
Intel Engine
    │
    ├── VirusTotal API v3
    │       └── GET /api/v3/ip_addresses/{ip}
    │
    ├── AbuseIPDB API v2
    │       └── GET /api/v2/check?ipAddress={ip}
    │
    └── AlienVault OTX API v1
            └── GET /api/v1/indicators/IPv4/{ip}/general
```

**Rate Limiting Strategy:**
- 1-second delay between API calls
- 60-second backoff on 429 responses
- Queue-based processing for bursts

### 8.3 LLM Integration

```
Investigation Engine
    │
    └── Ollama REST API
            │
            ├── GET  /api/tags          (List models)
            ├── POST /api/pull          (Download model)
            └── POST /api/generate      (Inference)

Prompt Template:
┌─────────────────────────────────────────────────────────┐
│ You are an expert SOC analyst. Analyze this incident:   │
│                                                         │
│ Incident Data: {incident_json}                          │
│ Threat Intel: {intel_json}                              │
│                                                         │
│ Provide:                                                │
│ 1. Summary (2-3 sentences)                              │
│ 2. Severity (Critical/High/Medium/Low)                  │
│ 3. Attack Vector                                        │
│ 4. Recommendations (3-5 steps)                          │
│ 5. Risk Score (0-100)                                   │
└─────────────────────────────────────────────────────────┘
```

### 8.4 Dashboard API Integration

```
Dashboard (Next.js)
    │
    ├── GET  /api/stats        → StatusCards
    ├── GET  /api/alerts       → AlertStream
    ├── GET  /api/incidents    → IncidentTimeline
    ├── GET  /api/risks        → RiskHeatmap
    ├── GET  /api/graph        → AttackGraph
    ├── GET  /api/iocs         → IOCExplorer
    └── POST /api/assistant    → SOCAssistant
```

**Polling Strategy:** Dashboard fetches data every 10 seconds for real-time updates.

---

## 9. Security Considerations

### 9.1 Data Protection

| Aspect | Implementation |
|--------|----------------|
| **Data at Rest** | MongoDB encryption available |
| **Data in Transit** | Internal Docker network (isolatable with TLS) |
| **API Keys** | Environment variables, never in code |
| **LLM Data** | All processing local, no external API calls |

### 9.2 Network Security

| Control | Implementation |
|---------|----------------|
| **Service Isolation** | Docker network segmentation |
| **Port Exposure** | Minimal external port mapping |
| **API Authentication** | Can add JWT/API key layer |
| **Rate Limiting** | Implemented for threat intel APIs |

### 9.3 Container Security

| Control | Implementation |
|---------|----------------|
| **Base Images** | Official images from trusted registries |
| **Non-root Users** | Configurable per service |
| **Read-only Filesystems** | Configurable per service |
| **Resource Limits** | CPU/memory constraints available |

### 9.4 Operational Security

| Control | Implementation |
|---------|----------------|
| **Logging** | All services log to stdout |
| **Monitoring** | Container health checks |
| **Updates** | Image version pinning available |
| **Secrets Management** | Environment file isolation |

---

## 10. Future Enhancements

### 10.1 Short-Term Roadmap (3-6 months)

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| **SOAR Integration** | Automated response playbooks | High |
| **User Authentication** | OAuth2/SAML integration | High |
| **Alert Notifications** | Slack/Teams/Email alerts | Medium |
| **Custom Detection Rules** | User-defined Sigma rules | Medium |

### 10.2 Medium-Term Roadmap (6-12 months)

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| **Multi-Tenancy** | Organization separation | High |
| **Case Management** | Investigation workflow tracking | High |
| **Reporting Module** | PDF/HTML report generation | Medium |
| **Threat Hunting** | Proactive search capabilities | Medium |

### 10.3 Long-Term Vision (12+ months)

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| **ML Anomaly Detection** | Behavioral analysis | High |
| **Automated Remediation** | Self-healing responses | High |
| **Threat Prediction** | Predictive threat modeling | Medium |
| **Federated Learning** | Cross-org threat sharing | Low |

---

## 11. Conclusion

### 11.1 Project Summary

The AI SOC Platform represents a modern approach to security operations, combining:

- **Real-time Processing**: Sub-second alert ingestion and processing
- **Intelligent Enrichment**: Automated multi-source threat intelligence
- **AI-Powered Analysis**: LLM-driven investigation and recommendations
- **Visual Analytics**: Knowledge graph and MITRE ATT&CK mapping
- **Unified Interface**: Single dashboard for all security operations

### 11.2 Key Achievements

| Metric | Achievement |
|--------|-------------|
| **Architecture** | Scalable microservices design |
| **Integration** | 4 external data sources |
| **AI Capabilities** | Local LLM for privacy-preserving analysis |
| **Visualization** | 8 interactive dashboard components |
| **Technology** | Modern, maintainable tech stack |

### 11.3 Value Proposition

The platform delivers value by:

1. **Reducing MTTD/MTTR** through automation
2. **Improving analyst efficiency** with AI assistance
3. **Enhancing threat visibility** with intelligence enrichment
4. **Enabling knowledge discovery** through graph analysis
5. **Maintaining data sovereignty** with local processing

### 11.4 Final Remarks

This AI SOC Platform demonstrates how modern technologies—containerization, streaming, graph databases, and large language models—can be combined to create a next-generation security operations capability. The modular architecture ensures the platform can evolve with changing security requirements while the open-source foundation keeps costs manageable for organizations of all sizes.

---

## Appendices

### Appendix A: API Endpoint Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats` | GET | Platform statistics |
| `/api/alerts` | GET | Recent alerts |
| `/api/incidents` | GET | All incidents |
| `/api/incidents/{id}` | GET | Single incident |
| `/api/risks` | GET | Risk rankings |
| `/api/graph` | GET | Knowledge graph |
| `/api/iocs` | GET | All IOCs |
| `/api/assistant` | POST | AI query |

### Appendix B: IOC Extraction Patterns

| IOC Type | Regex Pattern |
|----------|---------------|
| IPv4 | `\b(?:\d{1,3}\.){3}\d{1,3}\b` |
| Domain | `\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b` |
| MD5 | `\b[a-fA-F0-9]{32}\b` |
| SHA1 | `\b[a-fA-F0-9]{40}\b` |
| SHA256 | `\b[a-fA-F0-9]{64}\b` |
| URL | `https?://[^\s<>"{}|\\^` + "`" + `\[\]]+` |

### Appendix C: MITRE ATT&CK Mapping

| Tactic | Supported Techniques |
|--------|---------------------|
| Initial Access | T1190, T1133, T1566 |
| Execution | T1059, T1203, T1204 |
| Persistence | T1098, T1136, T1053 |
| Privilege Escalation | T1548, T1134, T1068 |
| Defense Evasion | T1070, T1562, T1036 |
| Credential Access | T1110, T1003, T1555 |
| Discovery | T1087, T1082, T1083 |
| Lateral Movement | T1021, T1091, T1080 |
| Collection | T1005, T1114, T1119 |
| Command & Control | T1071, T1105, T1573 |
| Exfiltration | T1041, T1048, T1567 |
| Impact | T1485, T1486, T1489 |

---

**Document End**

*This report provides a comprehensive technical overview of the AI SOC Platform. For implementation details, refer to the source code and README documentation.*
