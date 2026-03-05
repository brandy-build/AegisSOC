import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const getColor = (score) => {
  if (score >= 80) return 'rgba(239, 68, 68, 0.9)';
  if (score >= 60) return 'rgba(249, 115, 22, 0.9)';
  if (score >= 40) return 'rgba(234, 179, 8, 0.9)';
  return 'rgba(34, 197, 94, 0.9)';
};

const getGlow = (score) => {
  if (score >= 80) return '0 0 20px rgba(239, 68, 68, 0.5)';
  if (score >= 60) return '0 0 20px rgba(249, 115, 22, 0.5)';
  if (score >= 40) return '0 0 20px rgba(234, 179, 8, 0.5)';
  return '0 0 20px rgba(34, 197, 94, 0.5)';
};

export default function RiskHeatmap({ risks }) {
  const sortedRisks = [...risks].sort((a, b) => b.score - a.score).slice(0, 10);
  
  const data = {
    labels: sortedRisks.map(r => r.id?.substring(0, 8) || 'Unknown'),
    datasets: [{
      label: 'Risk Score',
      data: sortedRisks.map(r => r.score),
      backgroundColor: sortedRisks.map(r => getColor(r.score)),
      borderColor: sortedRisks.map(r => getColor(r.score).replace('0.9', '1')),
      borderWidth: 0,
      borderRadius: 8,
      borderSkipped: false
    }]
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(20, 20, 35, 0.95)',
        titleColor: '#fff',
        bodyColor: '#888',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: { color: '#666', font: { size: 11 } },
        title: { display: true, text: 'Risk Score', color: '#666', font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#666', font: { size: 10 } },
        title: { display: true, text: 'Incident ID', color: '#666', font: { size: 11 } }
      }
    }
  };
  
  return (
    <div className="risk-heatmap">
      <div className="header">
        <h3>📊 Risk Distribution</h3>
        <span className="subtitle">Top 10 by severity</span>
      </div>
      
      <div className="chart-container">
        {risks.length > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="empty">
            <span className="empty-icon">📉</span>
            <p>No risk data available</p>
          </div>
        )}
      </div>
      
      <div className="legend">
        <div className="legend-item"><span className="dot critical"></span>Critical (80+)</div>
        <div className="legend-item"><span className="dot high"></span>High (60-79)</div>
        <div className="legend-item"><span className="dot medium"></span>Medium (40-59)</div>
        <div className="legend-item"><span className="dot low"></span>Low (&lt;40)</div>
      </div>
      
      <style jsx>{`
        .risk-heatmap {
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
        .subtitle { font-size: 0.75rem; color: #666; }
        .chart-container {
          padding: 1.5rem;
          height: 280px;
        }
        .empty {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: #666;
        }
        .empty-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          opacity: 0.5;
        }
        .legend {
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          color: #888;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
        }
        .dot.critical { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.5); }
        .dot.high { background: #f97316; box-shadow: 0 0 8px rgba(249,115,22,0.5); }
        .dot.medium { background: #eab308; box-shadow: 0 0 8px rgba(234,179,8,0.5); }
        .dot.low { background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.5); }
      `}</style>
    </div>
  );
}
