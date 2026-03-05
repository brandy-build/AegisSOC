import React, { useState } from 'react';

const getLevelInfo = (level) => {
  if (level >= 12) return { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
  if (level >= 8) return { label: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.15)' };
  if (level >= 5) return { label: 'Medium', color: '#eab308', bg: 'rgba(234,179,8,0.15)' };
  return { label: 'Low', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
};

export default function AlertStream({ alerts }) {
  const [filter, setFilter] = useState('all');
  
  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true;
    const level = a.rule?.level || 0;
    if (filter === 'critical') return level >= 12;
    if (filter === 'high') return level >= 8 && level < 12;
    if (filter === 'medium') return level >= 5 && level < 8;
    return level < 5;
  });

  return (
    <div className="alert-stream">
      <div className="header">
        <div className="title-section">
          <h3>🔔 Alert Stream</h3>
          <span className="count">{alerts.length} alerts</span>
        </div>
        <div className="filters">
          {['all', 'critical', 'high', 'medium', 'low'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="table-container">
        {filteredAlerts.length === 0 ? (
          <div className="empty">No alerts match your filter</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Agent</th>
                <th>Rule Description</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.slice(0, 25).map((a, i) => {
                const levelInfo = getLevelInfo(a.rule?.level || 0);
                return (
                  <tr key={a._id || i} className="alert-row">
                    <td className="time">{a.timestamp ? new Date(a.timestamp).toLocaleString() : 'N/A'}</td>
                    <td className="agent">{a.agent?.name || 'Unknown'}</td>
                    <td className="rule">{a.rule?.description || 'No description'}</td>
                    <td>
                      <span className="badge" style={{ color: levelInfo.color, background: levelInfo.bg }}>
                        {levelInfo.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      
      <style jsx>{`
        .alert-stream {
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
          flex-wrap: wrap;
          gap: 1rem;
        }
        .title-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
        }
        .count {
          font-size: 0.75rem;
          color: #888;
          padding: 0.25rem 0.75rem;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
        }
        .filters {
          display: flex;
          gap: 0.5rem;
        }
        .filter-btn {
          padding: 0.4rem 0.8rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #888;
          font-size: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .filter-btn.active {
          background: linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2));
          border-color: rgba(0,212,255,0.3);
          color: #00d4ff;
        }
        .table-container {
          max-height: 350px;
          overflow-y: auto;
        }
        .empty {
          padding: 2rem;
          text-align: center;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background: rgba(0,0,0,0.2);
          color: #888;
          padding: 0.75rem 1rem;
          text-align: left;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: sticky;
          top: 0;
        }
        td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 0.85rem;
        }
        .alert-row {
          transition: background 0.15s;
        }
        .alert-row:hover {
          background: rgba(255,255,255,0.02);
        }
        .time {
          color: #666;
          font-size: 0.8rem;
          white-space: nowrap;
        }
        .agent {
          color: #00d4ff;
          font-weight: 500;
        }
        .rule {
          color: #e0e0e0;
          max-width: 400px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .badge {
          padding: 0.3rem 0.75rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}
