
import requests, pymongo, os, time
from pymongo import UpdateOne

mongo = pymongo.MongoClient(os.getenv('MONGO_URI', 'mongodb://mongodb:27017')).ai_soc
VT_API_KEY = os.getenv('VIRUSTOTAL_API_KEY')
ABUSEIPDB_API_KEY = os.getenv('ABUSEIPDB_API_KEY')
ALIENVAULT_OTX_API_KEY = os.getenv('ALIENVAULT_OTX_API_KEY')

def vt_lookup(ip):
    if not VT_API_KEY or not ip:
        return {}
    try:
        r = requests.get(f'https://www.virustotal.com/api/v3/ip_addresses/{ip}', headers={'x-apikey': VT_API_KEY}, timeout=10)
        if r.status_code == 200:
            return r.json()
        elif r.status_code == 429:
            print('VirusTotal rate limit hit, sleeping...')
            time.sleep(60)
            return {}
        else:
            print(f'VT error: {r.status_code}')
            return {}
    except Exception as e:
        print(f'VT lookup error: {e}')
        return {}

def abuseipdb_lookup(ip):
    if not ABUSEIPDB_API_KEY or not ip:
        return {}
    try:
        r = requests.get(f'https://api.abuseipdb.com/api/v2/check', params={'ipAddress': ip}, headers={'Key': ABUSEIPDB_API_KEY, 'Accept': 'application/json'}, timeout=10)
        if r.status_code == 200:
            return r.json()
        elif r.status_code == 429:
            print('AbuseIPDB rate limit hit, sleeping...')
            time.sleep(60)
            return {}
        else:
            print(f'AbuseIPDB error: {r.status_code}')
            return {}
    except Exception as e:
        print(f'AbuseIPDB lookup error: {e}')
        return {}

def otx_lookup(ip):
    if not ALIENVAULT_OTX_API_KEY or not ip:
        return {}
    try:
        r = requests.get(f'https://otx.alienvault.com/api/v1/indicators/IPv4/{ip}/general', headers={'X-OTX-API-KEY': ALIENVAULT_OTX_API_KEY}, timeout=10)
        if r.status_code == 200:
            return r.json()
        elif r.status_code == 429:
            print('OTX rate limit hit, sleeping...')
            time.sleep(60)
            return {}
        else:
            print(f'OTX error: {r.status_code}')
            return {}
    except Exception as e:
        print(f'OTX lookup error: {e}')
        return {}

def enrich_incidents():
    print(f"Intel engine started. VT: {'configured' if VT_API_KEY else 'not set'}, AbuseIPDB: {'configured' if ABUSEIPDB_API_KEY else 'not set'}, OTX: {'configured' if ALIENVAULT_OTX_API_KEY else 'not set'}")
    while True:
        batch = []
        for incident in mongo.incidents.find({'intel': {'$exists': False}, 'alert': {'$exists': True}}):
            ip = incident.get('alert', {}).get('src_ip')
            if not ip:
                continue
            print(f"Enriching incident {incident['_id']} for IP: {ip}")
            vt = vt_lookup(ip)
            abuse = abuseipdb_lookup(ip)
            otx = otx_lookup(ip)
            intel = {'virustotal': vt, 'abuseipdb': abuse, 'alienvault_otx': otx, 'enriched_at': time.time()}
            batch.append(UpdateOne({'_id': incident['_id']}, {'$set': {'intel': intel}}))
            print(f"Enriched incident {incident['_id']} with intel")
            time.sleep(1)  # avoid hammering APIs
        if batch:
            mongo.incidents.bulk_write(batch)
            print(f"Updated {len(batch)} incidents with intel")
        time.sleep(10)  # check for new incidents every 10 seconds

if __name__ == "__main__":
    enrich_incidents()
    enrich_incidents()
