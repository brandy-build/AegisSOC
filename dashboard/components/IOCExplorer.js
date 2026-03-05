import React, { useState } from 'react';

const IocIcon = ({ type }) => {
  const icons = {
    ip: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    domain: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    hash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
    url: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    email: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    file: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
  };
  return icons[type] || <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>;
};

const IOC_TYPE_COLORS = {
  ip: '#00d4ff',
  domain: '#7c3aed',
  hash: '#f97316',
  url: '#06ffa5',
  email: '#22c55e',
  file: '#ef4444'
};

export default function IOCExplorer({ iocs }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedIoc, setSelectedIoc] = useState(null);
  const [sortBy, setSortBy] = useState('count');
  
  const processedIocs = React.useMemo(() => {
    if (!iocs || !Array.isArray(iocs)) return [];
    return iocs;
  }, [iocs]);
  
  const filteredIocs = processedIocs
    .filter(ioc => {
      if (typeFilter !== 'all' && ioc.type !== typeFilter) return false;
      if (search && !ioc.value.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'count') return (b.count || 0) - (a.count || 0);
      if (sortBy === 'risk') return (b.risk_score || 0) - (a.risk_score || 0);
      return a.value.localeCompare(b.value);
    });

  const typeStats = processedIocs.reduce((acc, ioc) => {
    acc[ioc.type] = (acc[ioc.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="ioc-container">
      <div className="header">
        <h3>🔍 IOC Explorer</h3>
        <span className="total">{processedIocs.length} indicators</span>
      </div>
      
      <div className="stats-bar">
        {Object.entries(typeStats).map(([type, count]) => (
          <button 
            key={type}
            className={`stat-chip ${typeFilter === type ? 'active' : ''}`}
            onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
          >
            <IocIcon type={type} /> {type.toUpperCase()}: {count}
          </button>
        ))}
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search IOCs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="filter-select">
          <option value="all">All Types</option>
          <option value="ip">IP Addresses</option>
          <option value="domain">Domains</option>
          <option value="hash">Hashes</option>
          <option value="url">URLs</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="filter-select">
          <option value="count">Sort by Count</option>
          <option value="risk">Sort by Risk</option>
          <option value="value">Sort by Value</option>
        </select>
      </div>

      <div className="ioc-list">
        {filteredIocs.length === 0 ? (
          <div className="empty">
            No IOCs found. {processedIocs.length === 0 ? 'Process alerts to extract IOCs.' : 'Adjust your search.'}
          </div>
        ) : (
          filteredIocs.map((ioc, idx) => (
            <div 
              key={idx}
              className={`ioc-row ${selectedIoc === idx ? 'selected' : ''}`}
              onClick={() => setSelectedIoc(selectedIoc === idx ? null : idx)}
            >
              <span className="icon"><IocIcon type={ioc.type} /></span>
              <div className="ioc-content">
                <span className="value" style={{ color: IOC_TYPE_COLORS[ioc.type] }}>{ioc.value}</span>
                {selectedIoc === idx && ioc.intel && (
                  <div className="intel-details">
                    <div><strong>Source:</strong> {ioc.intel.source || 'Unknown'}</div>
                    {ioc.intel.malicious !== undefined && (
                      <div><strong>Status:</strong> {ioc.intel.malicious ? '⚠️ Malicious' : '✅ Clean'}</div>
                    )}
                    {ioc.intel.country && <div><strong>Country:</strong> {ioc.intel.country}</div>}
                    {ioc.intel.asn && <div><strong>ASN:</strong> {ioc.intel.asn}</div>}
                  </div>
                )}
              </div>
              <div className="badges">
                <span className="badge type" style={{ background: `${IOC_TYPE_COLORS[ioc.type]}33`, color: IOC_TYPE_COLORS[ioc.type] }}>
                  {ioc.type}
                </span>
                {ioc.count && <span className="badge count">×{ioc.count}</span>}
                {ioc.risk_score && (
                  <span className={`badge risk ${ioc.risk_score > 70 ? 'critical' : ioc.risk_score > 40 ? 'high' : 'low'}`}>
                    {ioc.risk_score}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      <style jsx>{`
        .ioc-container {
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
        .total {
          font-size: 0.75rem;
          color: #00d4ff;
          background: rgba(0,212,255,0.1);
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
        }
        .stats-bar {
          display: flex;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          flex-wrap: wrap;
        }
        .stat-chip {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #888;
          padding: 0.4rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .stat-chip:hover { border-color: #00d4ff; color: #00d4ff; }
        .stat-chip.active {
          background: rgba(0,212,255,0.2);
          border-color: #00d4ff;
          color: #00d4ff;
        }
        .filters {
          padding: 1rem 1.5rem;
          display: flex;
          gap: 0.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          flex-wrap: wrap;
        }
        .search-input {
          flex: 1;
          min-width: 180px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 0.5rem 1rem;
          color: #e0e0e0;
          font-size: 0.85rem;
        }
        .search-input:focus {
          outline: none;
          border-color: #00d4ff;
          box-shadow: 0 0 0 2px rgba(0,212,255,0.2);
        }
        .search-input::placeholder { color: #555; }
        .filter-select {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 0.5rem 1rem;
          color: #e0e0e0;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .filter-select:focus { outline: none; border-color: #00d4ff; }
        .ioc-list {
          max-height: 400px;
          overflow-y: auto;
        }
        .ioc-list::-webkit-scrollbar { width: 6px; }
        .ioc-list::-webkit-scrollbar-track { background: transparent; }
        .ioc-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .empty {
          padding: 3rem;
          text-align: center;
          color: #555;
        }
        .ioc-row {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          cursor: pointer;
          transition: background 0.15s;
        }
        .ioc-row:hover { background: rgba(255,255,255,0.03); }
        .ioc-row.selected { background: rgba(0,212,255,0.08); }
        .icon { font-size: 1.1rem; margin-right: 0.75rem; width: 28px; }
        .ioc-content { flex: 1; min-width: 0; }
        .value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          word-break: break-all;
        }
        .intel-details {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          font-size: 0.75rem;
          color: #888;
        }
        .intel-details div { margin-bottom: 0.25rem; }
        .intel-details strong { color: #aaa; }
        .badges { display: flex; gap: 0.4rem; flex-shrink: 0; margin-left: 0.5rem; }
        .badge {
          padding: 0.2rem 0.5rem;
          border-radius: 10px;
          font-size: 0.65rem;
          font-weight: 600;
        }
        .badge.type { text-transform: uppercase; }
        .badge.count { background: rgba(255,255,255,0.08); color: #888; }
        .badge.risk { color: #fff; }
        .badge.risk.critical { background: #ef4444; }
        .badge.risk.high { background: #f97316; }
        .badge.risk.low { background: #22c55e; }
      `}</style>
    </div>
  );
}
