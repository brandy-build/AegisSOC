import React, { useState } from 'react';

// Simplified MITRE ATT&CK Matrix
const MITRE_TACTICS = [
  { id: 'TA0001', name: 'Initial Access', techniques: ['T1190', 'T1133', 'T1566'] },
  { id: 'TA0002', name: 'Execution', techniques: ['T1059', 'T1203', 'T1204'] },
  { id: 'TA0003', name: 'Persistence', techniques: ['T1098', 'T1136', 'T1053'] },
  { id: 'TA0004', name: 'Privilege Escalation', techniques: ['T1548', 'T1134', 'T1068'] },
  { id: 'TA0005', name: 'Defense Evasion', techniques: ['T1070', 'T1562', 'T1036'] },
  { id: 'TA0006', name: 'Credential Access', techniques: ['T1110', 'T1003', 'T1555'] },
  { id: 'TA0007', name: 'Discovery', techniques: ['T1087', 'T1082', 'T1083'] },
  { id: 'TA0008', name: 'Lateral Movement', techniques: ['T1021', 'T1091', 'T1080'] },
  { id: 'TA0009', name: 'Collection', techniques: ['T1005', 'T1114', 'T1119'] },
  { id: 'TA0011', name: 'Command & Control', techniques: ['T1071', 'T1105', 'T1573'] },
  { id: 'TA0010', name: 'Exfiltration', techniques: ['T1041', 'T1048', 'T1567'] },
  { id: 'TA0040', name: 'Impact', techniques: ['T1485', 'T1486', 'T1489'] }
];

const TECHNIQUE_NAMES = {
  'T1190': 'Exploit Public-Facing App',
  'T1133': 'External Remote Services',
  'T1566': 'Phishing',
  'T1059': 'Command & Scripting',
  'T1203': 'Exploitation for Client Exec',
  'T1204': 'User Execution',
  'T1098': 'Account Manipulation',
  'T1136': 'Create Account',
  'T1053': 'Scheduled Task/Job',
  'T1548': 'Abuse Elevation Control',
  'T1134': 'Access Token Manipulation',
  'T1068': 'Exploitation for Privilege',
  'T1070': 'Indicator Removal',
  'T1562': 'Impair Defenses',
  'T1036': 'Masquerading',
  'T1110': 'Brute Force',
  'T1003': 'OS Credential Dumping',
  'T1555': 'Credentials from Password Stores',
  'T1087': 'Account Discovery',
  'T1082': 'System Info Discovery',
  'T1083': 'File & Directory Discovery',
  'T1021': 'Remote Services',
  'T1091': 'Replication Through Media',
  'T1080': 'Taint Shared Content',
  'T1005': 'Data from Local System',
  'T1114': 'Email Collection',
  'T1119': 'Automated Collection',
  'T1071': 'Application Layer Protocol',
  'T1105': 'Ingress Tool Transfer',
  'T1573': 'Encrypted Channel',
  'T1041': 'Exfiltration Over C2',
  'T1048': 'Exfiltration Over Alt Protocol',
  'T1567': 'Exfiltration Over Web Service',
  'T1485': 'Data Destruction',
  'T1486': 'Data Encrypted for Impact',
  'T1489': 'Service Stop'
};

// Map rule descriptions to MITRE techniques
function mapToMitre(incidents) {
  const mapped = {};
  
  incidents.forEach(inc => {
    const ruleDesc = inc.alert?.rule?.description?.toLowerCase() || '';
    
    // Simple keyword mapping
    if (ruleDesc.includes('brute force') || ruleDesc.includes('failed login')) {
      mapped['T1110'] = (mapped['T1110'] || 0) + 1;
    }
    if (ruleDesc.includes('malware') || ruleDesc.includes('virus')) {
      mapped['T1204'] = (mapped['T1204'] || 0) + 1;
    }
    if (ruleDesc.includes('phishing')) {
      mapped['T1566'] = (mapped['T1566'] || 0) + 1;
    }
    if (ruleDesc.includes('credential') || ruleDesc.includes('password')) {
      mapped['T1003'] = (mapped['T1003'] || 0) + 1;
    }
    if (ruleDesc.includes('lateral') || ruleDesc.includes('remote')) {
      mapped['T1021'] = (mapped['T1021'] || 0) + 1;
    }
    if (ruleDesc.includes('exfil') || ruleDesc.includes('data theft')) {
      mapped['T1041'] = (mapped['T1041'] || 0) + 1;
    }
    if (ruleDesc.includes('command') || ruleDesc.includes('script') || ruleDesc.includes('powershell')) {
      mapped['T1059'] = (mapped['T1059'] || 0) + 1;
    }
    if (ruleDesc.includes('ransomware') || ruleDesc.includes('encrypt')) {
      mapped['T1486'] = (mapped['T1486'] || 0) + 1;
    }
  });
  
  return mapped;
}

export default function MitreMapping({ incidents }) {
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const mappedTechniques = mapToMitre(incidents || []);
  
  const getTechniqueStyle = (techId) => {
    const count = mappedTechniques[techId] || 0;
    if (count === 0) return { bg: 'rgba(255,255,255,0.05)', text: '#555' };
    if (count === 1) return { bg: 'rgba(234,179,8,0.3)', text: '#eab308' };
    if (count <= 3) return { bg: 'rgba(249,115,22,0.4)', text: '#f97316' };
    return { bg: 'rgba(239,68,68,0.5)', text: '#ef4444' };
  };

  return (
    <div className="mitre-container">
      <div className="header">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '0.5rem', verticalAlign: 'middle'}}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>MITRE ATT&CK Coverage</h3>
        <span className="stats">{Object.keys(mappedTechniques).length} techniques detected</span>
      </div>
      
      <div className="matrix-scroll">
        <div className="matrix">
          {MITRE_TACTICS.map(tactic => (
            <div key={tactic.id} className="tactic-column">
              <div className="tactic-header">{tactic.name}</div>
              <div className="techniques">
                {tactic.techniques.map(techId => {
                  const count = mappedTechniques[techId] || 0;
                  const style = getTechniqueStyle(techId);
                  return (
                    <div
                      key={techId}
                      className={`technique ${count > 0 ? 'hit' : ''}`}
                      style={{ background: style.bg, color: style.text }}
                      onClick={() => setSelectedTechnique(techId)}
                      title={TECHNIQUE_NAMES[techId]}
                    >
                      {techId}
                      {count > 0 && <span className="hit-count">{count}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="footer">
        <div className="legend">
          <div className="legend-item"><span className="dot none"></span>No hits</div>
          <div className="legend-item"><span className="dot low"></span>1 hit</div>
          <div className="legend-item"><span className="dot med"></span>2-3 hits</div>
          <div className="legend-item"><span className="dot high"></span>4+ hits</div>
        </div>
      </div>
      
      {selectedTechnique && (
        <div className="detail-overlay">
          <div className="detail-card">
            <div className="detail-header">
              <span className="tech-id">{selectedTechnique}</span>
              <button onClick={() => setSelectedTechnique(null)}>×</button>
            </div>
            <h4>{TECHNIQUE_NAMES[selectedTechnique]}</h4>
            <div className="detail-stats">
              <span className="stat-label">Detections</span>
              <span className="stat-value">{mappedTechniques[selectedTechnique] || 0}</span>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .mitre-container {
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
        .stats { font-size: 0.75rem; color: #666; }
        .matrix-scroll {
          overflow-x: auto;
          padding: 1.5rem;
        }
        .matrix {
          display: flex;
          gap: 4px;
          min-width: 1100px;
        }
        .tactic-column { flex: 1; min-width: 85px; }
        .tactic-header {
          background: linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2));
          color: #00d4ff;
          padding: 0.6rem 0.25rem;
          font-size: 0.6rem;
          font-weight: 600;
          text-align: center;
          border-radius: 6px 6px 0 0;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .techniques { display: flex; flex-direction: column; gap: 3px; margin-top: 3px; }
        .technique {
          padding: 0.5rem 0.25rem;
          font-size: 0.6rem;
          font-weight: 500;
          text-align: center;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        .technique:hover { transform: scale(1.05); filter: brightness(1.2); }
        .technique.hit { font-weight: 700; }
        .hit-count {
          position: absolute;
          top: -3px;
          right: -3px;
          background: #ef4444;
          color: #fff;
          font-size: 0.5rem;
          padding: 1px 5px;
          border-radius: 10px;
          font-weight: 700;
        }
        .footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .legend {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          color: #888;
        }
        .dot { width: 10px; height: 10px; border-radius: 3px; }
        .dot.none { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
        .dot.low { background: rgba(234,179,8,0.5); }
        .dot.med { background: rgba(249,115,22,0.6); }
        .dot.high { background: rgba(239,68,68,0.7); }
        .detail-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .detail-card {
          background: rgba(20, 20, 35, 0.98);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 1.5rem;
          width: 320px;
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .tech-id {
          background: linear-gradient(135deg, #00d4ff, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
          font-size: 1.25rem;
        }
        .detail-header button {
          background: rgba(255,255,255,0.1);
          border: none;
          color: #888;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          font-size: 1.25rem;
          cursor: pointer;
        }
        .detail-header button:hover { background: rgba(255,255,255,0.2); color: #fff; }
        h4 { margin: 0 0 1rem 0; color: #e0e0e0; font-size: 1rem; }
        .detail-stats {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
        }
        .stat-label { color: #888; font-size: 0.8rem; }
        .stat-value { color: #00d4ff; font-weight: 700; }
      `}</style>
    </div>
  );
}
