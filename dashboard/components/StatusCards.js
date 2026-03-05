import React from 'react';

const CardIcon = ({ type }) => {
  const icons = {
    incidents: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    enriched: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    investigated: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.5V22l3-2 3 2v-4.5c2.9-1.2 5-4.1 5-7.5a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>,
    critical: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>,
    high: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>,
    medium: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>,
    low: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
  };
  return icons[type] || null;
};

export default function StatusCards({ stats }) {
  const risk = stats.risk_distribution || { critical: 0, high: 0, medium: 0, low: 0 };
  
  const cards = [
    { label: 'Total Incidents', value: stats.total_incidents || 0, iconType: 'incidents', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', glow: 'rgba(102,126,234,0.4)' },
    { label: 'Enriched', value: stats.enriched_incidents || 0, iconType: 'enriched', gradient: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)', glow: 'rgba(0,212,255,0.4)' },
    { label: 'Investigated', value: stats.investigated_incidents || 0, iconType: 'investigated', gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', glow: 'rgba(124,58,237,0.4)' },
    { label: 'Critical', value: risk.critical, iconType: 'critical', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', glow: 'rgba(239,68,68,0.4)' },
    { label: 'High', value: risk.high, iconType: 'high', gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', glow: 'rgba(249,115,22,0.4)' },
    { label: 'Medium', value: risk.medium, iconType: 'medium', gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', glow: 'rgba(234,179,8,0.4)' },
    { label: 'Low', value: risk.low, iconType: 'low', gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', glow: 'rgba(34,197,94,0.4)' },
  ];

  return (
    <div className="status-cards">
      {cards.map((card, idx) => (
        <div key={idx} className="card" style={{ '--gradient': card.gradient, '--glow': card.glow }}>
          <div className="card-inner">
            <div className="card-icon"><CardIcon type={card.iconType} /></div>
            <div className="card-content">
              <span className="card-label">{card.label}</span>
              <span className="card-value">{card.value}</span>
            </div>
          </div>
          <div className="card-bg"></div>
        </div>
      ))}
      
      <style jsx>{`
        .status-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .card {
          position: relative;
          background: rgba(20, 20, 35, 0.8);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.25rem;
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: default;
        }
        .card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,255,255,0.15);
          box-shadow: 0 20px 40px var(--glow);
        }
        .card-inner {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .card-icon {
          font-size: 1.5rem;
          filter: drop-shadow(0 0 8px var(--glow));
        }
        .card-content {
          display: flex;
          flex-direction: column;
        }
        .card-label {
          font-size: 0.75rem;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .card-value {
          font-size: 1.75rem;
          font-weight: 700;
          background: var(--gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .card-bg {
          position: absolute;
          top: 0;
          right: 0;
          width: 100px;
          height: 100px;
          background: var(--gradient);
          opacity: 0.05;
          border-radius: 50%;
          transform: translate(30%, -30%);
          filter: blur(20px);
          transition: opacity 0.3s;
        }
        .card:hover .card-bg {
          opacity: 0.1;
        }
      `}</style>
    </div>
  );
}
