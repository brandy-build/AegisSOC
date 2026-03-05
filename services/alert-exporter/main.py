
import json, time, os
from confluent_kafka import Producer

KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'wazuh-alerts')
KAFKA_SERVERS = os.getenv('KAFKA_SERVERS', 'redpanda:9092')
ALERTS_PATH = os.getenv('WAZUH_ALERTS_PATH', '/var/ossec/logs/alerts/alerts.json')

producer = Producer({'bootstrap.servers': KAFKA_SERVERS})

def delivery_report(err, msg):
    if err:
        print(f"Delivery failed for alert: {err}")
    else:
        print(f"Alert delivered to {msg.topic()} [{msg.partition()}]")

def export_alerts():
    try:
        with open(ALERTS_PATH) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    alert = json.loads(line)
                except Exception as e:
                    print(f"Invalid alert JSON: {e}")
                    continue
                producer.produce(KAFKA_TOPIC, value=json.dumps(alert), callback=delivery_report)
                producer.poll(0)
                time.sleep(0.05)
        producer.flush()
    except Exception as e:
        print(f"Error reading alerts: {e}")

if __name__ == "__main__":
    export_alerts()
