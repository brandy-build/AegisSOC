# Setup Instructions

1. Copy `.env.example` to `.env` and fill in your API keys for VirusTotal, AbuseIPDB, and AlienVault OTX.
2. Run `docker-compose up --build` from the `infrastructure` folder.
3. Access the dashboard at `http://localhost:3000`.
4. Test alerts in Wazuh and verify incidents, enrichment, and dashboard panels.
