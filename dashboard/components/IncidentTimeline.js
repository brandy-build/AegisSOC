import React from 'react';

const getSeverityInfo = (score) => {
  if (score >= 80) return { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', glow: 'rgba(239,68,68,0.3)' };
  if (score >= 60) return { label: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.15)', glow: 'rgba(249,115,22,0.3)' };
  if (score >= 40) return { label: 'Medium', color: '#eab308', bg: 'rgba(234,179,8,0.15)', glow: 'rgba(234,179,8,0.3)' };
  return { label: 'Low', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', glow: 'rgba(34,197,94,0.3)' };
};

export default function IncidentTimeline({ incidents }) {
  return (
    <div className="timeline-container">
      <div className="header">
        <h3>📅 Incident Timeline</h3>
        <span className="count">{incidents.length} incidents</span>
      </div>
      
      <div className="timeline">
        {incidents.length === 0 ? (
          <div className="empty">No incidents detected yet</div>
        ) : (
          incidents.map((inc, i) => {
            const alert = inc.alert || {};
            const investigation = inc.investigation || {};
            const riskScore = investigation.risk_score || 0;
            const severity = getSeverityInfo(riskScore);
            const ruleDesc = alert.rule?.description || 'Unknown Incident';
            const srcIp = alert.src_ip || 'N/A';
            const timestamp = inc.timestamp ? new Date(typeof inc.timestamp === 'number' ? inc.timestamp * 1000 : inc.timestamp).toLocaleString() : 'N/A';
            
            return (
              <div key={inc._id || i} className="incident-card" style={{ '--accent': severity.color, '--glow': severity.glow }}>
                <div className="timeline-dot"></div>
                <div className="card-content">
                  <div className="card-header">
                    <span className="badge" style={{ color: severity.color, background: severity.bg }}>
                      {severity.label} • {riskScore}
                    </span>
                    <span className="time">{timestamp}</span>
                  </div>
                  <h4 className="title">{ruleDesc}</h4>
                  <div className="meta">
                    <span className="meta-item">🌐 {srcIp}</span>
                    <span className="meta-item">💻 {alert.agent?.name || 'Unknown'}</span>
                  </div>
                  {inc.iocs && Object.keys(inc.iocs).length > 0 && (
                    <div className="iocs">
                      {Object.entries(inc.iocs).map(([type, vals]) => (
                        <span key={type} className="ioc-tag">{type}: {vals.length}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <style jsx>{`
        .timeline-container {
          background: rgba(20, 20, 35, 0.8);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
        }
        .header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #fff; }
        .count {
          font-size: 0.75rem;
          color: #888;
          padding: 0.25rem 0.75rem;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
        }
        .timeline {
          max-height: 400px;
          overflow-y: auto;
          padding: 1rem;
        }
        .empty {
          padding: 2rem;
          text-align: center;
          color: #666;
        }
        .incident-card {
          position: relative;
          padding-left: 24px;
          margin-bottom: 1rem;
        }
        .timeline-dot {
          position: absolute;
          left: 0;
          top: 8px;
          width: 10px;
          height: 10px;
          background: var(--accent);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--glow);
        }
        .timeline-dot::before {
          content: '';
          position: absolute;
          left: 4px;
          top: 14px;
          width: 2px;
          height: calc(100% + 16px);
          background: rgba(255,255,255,0.1);
        }
        .incident-card:last-child .timeline-dot::before {
          display: none;
        }
        .card-content {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 1rem;
          transition: all 0.2s;
        }
        .card-content:hover {
          background: rgba(255,255,255,0.04);
          border-color: var(--accent);
          box-shadow: 0 4px 20px var(--glow);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .badge {
          padding: 0.3rem 0.75rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .time {
          font-size: 0.7rem;
          color: #666;
        }
        .title {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          font-weight: 500;
          color: #e0e0e0;
        }
        .meta {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        .meta-item {
          font-size: 0.75rem;
          color: #888;
        }
        .iocs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .ioc-tag {
          font-size: 0.65rem;
          padding: 0.2rem 0.5rem;
          background: rgba(0,212,255,0.1);
          color: #00d4ff;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
