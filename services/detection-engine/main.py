
from confluent_kafka import Consumer
import pymongo, json, re, time, os

KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'wazuh-alerts')
KAFKA_SERVERS = os.getenv('KAFKA_SERVERS', 'redpanda:9092')
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://mongodb:27017')

consumer = Consumer({
    'bootstrap.servers': KAFKA_SERVERS,
    'group.id': 'detector',
    'auto.offset.reset': 'earliest'
})
consumer.subscribe([KAFKA_TOPIC])
mongo = pymongo.MongoClient(MONGO_URI).ai_soc

print(f"Detection engine started. Listening to {KAFKA_TOPIC} on {KAFKA_SERVERS}")

IOC_PATTERNS = {
    'ip': r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b',
    'domain': r'\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b',
    'hash': r'\b[a-fA-F0-9]{32,64}\b',
}

def normalize(alert):
    # Example normalization: flatten keys, standardize field names
    norm = {}
    for k, v in alert.items():
        norm[k.lower().replace(' ', '_')] = v
    return norm

def find_iocs(text):
    iocs = {}
    for k, pat in IOC_PATTERNS.items():
        found = re.findall(pat, text)
        if found:
            iocs[k] = found
    return iocs

def correlate(alert):
    # Example: correlate by src_ip, user, or event type
    key = alert.get('src_ip') or alert.get('user')
    if key:
        related = list(mongo.incidents.find({'alert.src_ip': key}))
        return len(related) > 0
    return False

def process_alerts():
    while True:
        msg = consumer.poll(1.0)
        if msg and msg.value():
            try:
                alert = json.loads(msg.value())
            except Exception as e:
                print(f"Invalid alert JSON: {e}")
                continue
            norm_alert = normalize(alert)
            iocs = find_iocs(json.dumps(norm_alert))
            correlated = correlate(norm_alert)
            incident = {
                'alert': norm_alert,
                'iocs': iocs,
                'correlated': correlated,
                'timestamp': time.time(),
            }
            mongo.incidents.insert_one(incident)
            print(f"Incident created: {incident}")

if __name__ == "__main__":
    process_alerts()
