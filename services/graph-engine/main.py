
"""
Knowledge Graph Engine - Builds and maintains a security knowledge graph
"""
import pymongo, networkx as nx, os, time, pickle

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://mongodb:27017')
GRAPH_PATH = os.getenv('GRAPH_PATH', '/data/graph.gpickle')
mongo = pymongo.MongoClient(MONGO_URI).ai_soc

def build_graph():
    """Build the knowledge graph from all incidents"""
    G = nx.Graph()
    
    for inc in mongo.incidents.find():
        inc_id = str(inc['_id'])
        risk_score = inc.get('investigation', {}).get('risk_score', 0)
        
        # Add incident node
        G.add_node(inc_id, 
            type='incident',
            timestamp=inc.get('timestamp'),
            risk_score=risk_score,
            severity=inc.get('investigation', {}).get('analysis', {}).get('severity', 'unknown')
        )
        
        alert = inc.get('alert', {})
        iocs = inc.get('iocs', {})
        
        # Add IP nodes and edges
        for ip in iocs.get('ip', []):
            if not G.has_node(ip):
                # Get intel for this IP
                intel = inc.get('intel', {})
                vt_malicious = intel.get('virustotal', {}).get('data', {}).get('attributes', {}).get('last_analysis_stats', {}).get('malicious', 0)
                abuse_score = intel.get('abuseipdb', {}).get('data', {}).get('abuseConfidenceScore', 0)
                
                G.add_node(ip, 
                    type='ip',
                    vt_malicious=vt_malicious,
                    abuse_score=abuse_score,
                    threat_level='high' if vt_malicious > 3 or abuse_score > 50 else 'low'
                )
            G.add_edge(inc_id, ip, relation='involves_ip', weight=1)
        
        # Add domain nodes
        for domain in iocs.get('domain', []):
            if not G.has_node(domain):
                G.add_node(domain, type='domain')
            G.add_edge(inc_id, domain, relation='involves_domain', weight=1)
        
        # Add hash nodes
        for hash_val in iocs.get('hash', []):
            if not G.has_node(hash_val):
                G.add_node(hash_val, type='hash')
            G.add_edge(inc_id, hash_val, relation='involves_hash', weight=1)
        
        # Add user nodes
        user = alert.get('user')
        if user:
            if not G.has_node(user):
                G.add_node(user, type='user')
            G.add_edge(inc_id, user, relation='involves_user', weight=1)
        
        # Add host/agent nodes
        agent = alert.get('agent', {}).get('name')
        if agent:
            if not G.has_node(agent):
                G.add_node(agent, type='host')
            G.add_edge(inc_id, agent, relation='on_host', weight=1)
        
        # Add rule nodes
        rule_desc = alert.get('rule', {}).get('description')
        if rule_desc:
            rule_id = f"rule:{rule_desc[:50]}"
            if not G.has_node(rule_id):
                G.add_node(rule_id, 
                    type='rule',
                    description=rule_desc,
                    level=alert.get('rule', {}).get('level', 0)
                )
            G.add_edge(inc_id, rule_id, relation='triggered_by', weight=1)
    
    # Build attack chains - connect incidents sharing IOCs
    print("Building attack chains...")
    incidents = list(G.nodes(data=True))
    incident_nodes = [(n, d) for n, d in incidents if d.get('type') == 'incident']
    
    for i, (inc1, data1) in enumerate(incident_nodes):
        for inc2, data2 in incident_nodes[i+1:]:
            # Check shared neighbors (IOCs)
            shared = set(G.neighbors(inc1)) & set(G.neighbors(inc2))
            # Filter to only IOC-type nodes
            shared_iocs = [n for n in shared if G.nodes[n].get('type') in ('ip', 'domain', 'hash', 'user')]
            if len(shared_iocs) >= 1:
                G.add_edge(inc1, inc2, 
                    relation='attack_chain',
                    shared_iocs=shared_iocs,
                    weight=len(shared_iocs)
                )
    
    return G

def save_graph(G, path):
    """Save graph to file"""
    with open(path, 'wb') as f:
        pickle.dump(G, f, pickle.HIGHEST_PROTOCOL)
    print(f"Knowledge graph saved: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

def get_graph_stats(G):
    """Get statistics about the graph"""
    type_counts = {}
    for node, data in G.nodes(data=True):
        node_type = data.get('type', 'unknown')
        type_counts[node_type] = type_counts.get(node_type, 0) + 1
    
    return {
        'total_nodes': G.number_of_nodes(),
        'total_edges': G.number_of_edges(),
        'node_types': type_counts,
        'is_connected': nx.is_connected(G) if G.number_of_nodes() > 0 else False
    }

def run_graph_engine():
    """Main loop to continuously update the graph"""
    print(f"Graph engine started. Output: {GRAPH_PATH}")
    
    while True:
        try:
            G = build_graph()
            save_graph(G, GRAPH_PATH)
            stats = get_graph_stats(G)
            print(f"Graph stats: {stats}")
        except Exception as e:
            print(f"Error building graph: {e}")
        
        time.sleep(30)  # Rebuild every 30 seconds

if __name__ == "__main__":
    run_graph_engine()

