import React, { useEffect, useState } from 'react';
import StatusCards from '../components/StatusCards';
import AlertStream from '../components/AlertStream';
import IncidentTimeline from '../components/IncidentTimeline';
import RiskHeatmap from '../components/RiskHeatmap';
import AttackGraph from '../components/AttackGraph';
import MitreMapping from '../components/MitreMapping';
import IOCExplorer from '../components/IOCExplorer';
import SOCAssistant from '../components/SOCAssistant';

const Icon = ({ name }) => {
  const icons = {
    overview: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    graph: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" y1="8" x2="5" y2="16"/><line x1="12" y1="8" x2="19" y2="16"/></svg>,
    mitre: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    iocs: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    assistant: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="4"/><path d="M8 16h.01M16 16h.01M12 16v2"/></svg>,
    shield: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6M3 22v-6h6M21 12A9 9 0 0 0 6 5.3L3 8M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg>
  };
  return icons[name] || null;
};

const tabs = [
  { id: 'overview', label: 'Overview', icon: <Icon name="overview" /> },
  { id: 'graph', label: 'Attack Graph', icon: <Icon name="graph" /> },
  { id: 'mitre', label: 'MITRE ATT&CK', icon: <Icon name="mitre" /> },
  { id: 'iocs', label: 'IOC Explorer', icon: <Icon name="iocs" /> },
  { id: 'assistant', label: 'AI Assistant', icon: <Icon name="assistant" /> }
];

export default function Home() {
  const [stats, setStats] = useState({ total_incidents: 0, enriched_incidents: 0, investigated_incidents: 0, risk_distribution: {} });
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [risks, setRisks] = useState([]);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [iocs, setIocs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isLive, setIsLive] = useState(true);

  const API_BASE = 'http://localhost:8001';

  const fetchData = async () => {
    try {
      const [statsRes, alertsRes, incidentsRes, risksRes, graphRes, iocsRes] = await Promise.all([
        fetch(`${API_BASE}/api/stats`),
        fetch(`${API_BASE}/api/alerts`),
        fetch(`${API_BASE}/api/incidents`),
        fetch(`${API_BASE}/api/risks`),
        fetch(`${API_BASE}/api/graph`),
        fetch(`${API_BASE}/api/iocs`)
      ]);
      
      setStats(await statsRes.json());
      setAlerts(await alertsRes.json());
      setIncidents(await incidentsRes.json());
      setRisks(await risksRes.json());
      setGraph(await graphRes.json());
      setIocs(await iocsRes.json());
      setLastUpdate(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader">
          <div className="loader-ring"></div>
          <div className="loader-ring"></div>
          <div className="loader-ring"></div>
        </div>
        <h2>Initializing AI SOC Platform</h2>
        <p>Connecting to threat intelligence feeds...</p>
        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #fff;
          }
          .loader {
            position: relative;
            width: 100px;
            height: 100px;
            margin-bottom: 2rem;
          }
          .loader-ring {
            position: absolute;
            width: 100%;
            height: 100%;
            border: 3px solid transparent;
            border-top-color: #00d4ff;
            border-radius: 50%;
            animation: spin 1.5s linear infinite;
          }
          .loader-ring:nth-child(2) {
            width: 80%;
            height: 80%;
            top: 10%;
            left: 10%;
            border-top-color: #7c3aed;
            animation-duration: 2s;
            animation-direction: reverse;
          }
          .loader-ring:nth-child(3) {
            width: 60%;
            height: 60%;
            top: 20%;
            left: 20%;
            border-top-color: #06ffa5;
            animation-duration: 1s;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
            background: linear-gradient(90deg, #00d4ff, #7c3aed);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          p { color: #888; font-size: 0.9rem; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon"><Icon name="shield" /></div>
          <div className="logo-text">
            <span className="logo-title">SENTINEL</span>
            <span className="logo-subtitle">AI SOC Platform</span>
          </div>
        </div>
        <nav className="nav">
          {tabs.map(tab => (
            <button key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
              {activeTab === tab.id && <span className="nav-indicator"></span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="status-indicator">
            <span className={`status-dot ${isLive ? 'live' : ''}`}></span>
            <span>System {isLive ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div className="header-left">
            <h1 className="page-title">{tabs.find(t => t.id === activeTab)?.label}</h1>
            <span className="breadcrumb">Dashboard / {tabs.find(t => t.id === activeTab)?.label}</span>
          </div>
          <div className="header-right">
            <div className="live-badge"><span className="pulse"></span><span>LIVE</span></div>
            <div className="last-update">Updated: {lastUpdate || '--:--'}</div>
            <button className="refresh-btn" onClick={fetchData}><Icon name="refresh" /></button>
          </div>
        </header>

        <div className="content">
          <StatusCards stats={stats} />
          {activeTab === 'overview' && (
            <>
              <div className="grid-2">
                <IncidentTimeline incidents={incidents} />
                <RiskHeatmap risks={risks} />
              </div>
              <AlertStream alerts={alerts} />
            </>
          )}
          {activeTab === 'graph' && <AttackGraph data={graph} />}
          {activeTab === 'mitre' && <MitreMapping incidents={incidents} />}
          {activeTab === 'iocs' && <IOCExplorer iocs={iocs} />}
          {activeTab === 'assistant' && <SOCAssistant />}
        </div>
      </main>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #0a0a0f; color: #e0e0e0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #1a1a2e; }
        ::-webkit-scrollbar-thumb { background: #3d3d5c; border-radius: 3px; }
      `}</style>

      <style jsx>{`
        .dashboard { display: flex; min-height: 100vh; background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%); }
        .sidebar { width: 260px; background: rgba(15, 15, 26, 0.95); border-right: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; position: fixed; height: 100vh; backdrop-filter: blur(20px); }
        .logo { padding: 1.5rem; display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .logo-icon { font-size: 2rem; filter: drop-shadow(0 0 10px rgba(0,212,255,0.5)); }
        .logo-title { font-size: 1.25rem; font-weight: 700; background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: block; letter-spacing: 2px; }
        .logo-subtitle { font-size: 0.7rem; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .nav { flex: 1; padding: 1rem 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
        .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem; background: transparent; border: none; color: #888; font-size: 0.9rem; cursor: pointer; border-radius: 12px; transition: all 0.3s ease; position: relative; text-align: left; }
        .nav-item:hover { background: rgba(255,255,255,0.03); color: #fff; }
        .nav-item.active { background: linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(124,58,237,0.15) 100%); color: #fff; }
        .nav-icon { font-size: 1.1rem; width: 24px; text-align: center; }
        .nav-indicator { position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 24px; background: linear-gradient(180deg, #00d4ff, #7c3aed); border-radius: 0 3px 3px 0; }
        .sidebar-footer { padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .status-indicator { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #666; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #666; }
        .status-dot.live { background: #06ffa5; box-shadow: 0 0 10px #06ffa5; animation: pulse-glow 2s infinite; }
        @keyframes pulse-glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .main { flex: 1; margin-left: 260px; min-height: 100vh; }
        .header { position: sticky; top: 0; z-index: 100; padding: 1rem 2rem; background: rgba(10,10,15,0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
        .page-title { font-size: 1.5rem; font-weight: 600; background: linear-gradient(135deg, #fff 0%, #888 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .breadcrumb { font-size: 0.75rem; color: #555; margin-top: 0.25rem; display: block; }
        .header-right { display: flex; align-items: center; gap: 1rem; }
        .live-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(6,255,165,0.1); border: 1px solid rgba(6,255,165,0.3); border-radius: 20px; font-size: 0.75rem; font-weight: 600; color: #06ffa5; text-transform: uppercase; letter-spacing: 1px; }
        .pulse { width: 8px; height: 8px; background: #06ffa5; border-radius: 50%; animation: pulse-glow 2s infinite; }
        .last-update { font-size: 0.8rem; color: #666; }
        .refresh-btn { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #888; font-size: 1.2rem; cursor: pointer; transition: all 0.2s; }
        .refresh-btn:hover { background: rgba(255,255,255,0.1); color: #fff; transform: rotate(180deg); }
        .content { padding: 2rem; }
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 1.5rem; }
        @media (max-width: 1200px) { .grid-2 { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .sidebar { transform: translateX(-100%); } .main { margin-left: 0; } }
      `}</style>
    </div>
  );
}
