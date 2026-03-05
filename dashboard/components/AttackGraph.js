import React, { useEffect, useRef, useState, useCallback } from 'react';

const TYPE_CONFIG = {
  incident: { color: '#ff4757', ring: '#ff6b7a', label: 'Incident' },
  ip: { color: '#ffa502', ring: '#ffb732', label: 'IP Address' },
  domain: { color: '#eccc68', ring: '#f5d98a', label: 'Domain' },
  hash: { color: '#a55eea', ring: '#b87ef0', label: 'File Hash' },
  user: { color: '#2ed573', ring: '#5ae094', label: 'User' },
  host: { color: '#1e90ff', ring: '#4da6ff', label: 'Host' },
  rule: { color: '#ff6b81', ring: '#ff8fa0', label: 'Alert Rule' }
};

export default function AttackGraph({ data }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);

  // Initialize simulation
  useEffect(() => {
    if (!data?.nodes?.length) return;

    const width = 800;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;

    nodesRef.current = data.nodes.map((n) => ({
      ...n,
      x: centerX + (Math.random() - 0.5) * 350,
      y: centerY + (Math.random() - 0.5) * 280,
      vx: 0,
      vy: 0,
      radius: n.type === 'incident' ? 22 : 16,
      config: TYPE_CONFIG[n.type] || TYPE_CONFIG.host
    }));

    edgesRef.current = data.edges.map(e => ({
      ...e,
      pulseOffset: Math.random() * 100
    }));
  }, [data]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    let time = 0;

    const animate = () => {
      time += 0.016;

      // Clear with solid dark background
      ctx.fillStyle = '#080810';
      ctx.fillRect(0, 0, width, height);

      // Subtle dot grid
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      const gridSpacing = 30;
      for (let x = 0; x < width; x += gridSpacing) {
        for (let y = 0; y < height; y += gridSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!data?.nodes?.length) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.save();
      ctx.translate(width/2 + offset.x, height/2 + offset.y);
      ctx.scale(zoom, zoom);
      ctx.translate(-width/2, -height/2);

      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      // Physics - force-directed layout
      nodes.forEach(node => {
        // Center gravity
        node.vx += (width/2 - node.x) * 0.0003;
        node.vy += (height/2 - node.y) * 0.0003;

        // Node repulsion
        nodes.forEach(other => {
          if (node === other) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          if (dist < 150) {
            const force = (150 - dist) * 0.003;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        });
      });

      // Edge spring forces
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const force = (dist - 120) * 0.001;
          source.vx += (dx / dist) * force;
          source.vy += (dy / dist) * force;
          target.vx -= (dx / dist) * force;
          target.vy -= (dy / dist) * force;
        }
      });

      // Update positions
      nodes.forEach(node => {
        node.vx *= 0.92;
        node.vy *= 0.92;
        node.x += node.vx;
        node.y += node.vy;
        node.x = Math.max(50, Math.min(width - 50, node.x));
        node.y = Math.max(50, Math.min(height - 50, node.y));
      });

      // Draw edges - clean neural network lines
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        const isHighlighted = selectedNode && 
          (edge.source === selectedNode.id || edge.target === selectedNode.id);
        const isHoverHighlighted = hoveredNode && 
          (edge.source === hoveredNode.id || edge.target === hoveredNode.id);

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Calculate edge endpoints at circle borders
        const sourceRadius = source.radius + 3;
        const targetRadius = target.radius + 3;
        const sx = source.x + (dx / dist) * sourceRadius;
        const sy = source.y + (dy / dist) * sourceRadius;
        const tx = target.x - (dx / dist) * targetRadius;
        const ty = target.y - (dy / dist) * targetRadius;

        if (isHighlighted || isHoverHighlighted) {
          // Highlighted connection - gradient line
          const gradient = ctx.createLinearGradient(sx, sy, tx, ty);
          gradient.addColorStop(0, source.config.color);
          gradient.addColorStop(1, target.config.color);

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(tx, ty);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Flowing dot
          const pulse = (time * 0.5 + edge.pulseOffset) % 1;
          const px = sx + (tx - sx) * pulse;
          const py = sy + (ty - sy) * pulse;

          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
        } else {
          // Default connection - subtle line
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(tx, ty);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Draw nodes - hollow rings (neural network style)
      nodes.forEach(node => {
        const config = node.config;
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const isConnected = selectedNode && edges.some(e =>
          (e.source === selectedNode.id && e.target === node.id) ||
          (e.target === selectedNode.id && e.source === node.id)
        );

        const radius = node.radius * (isSelected ? 1.2 : isHovered ? 1.15 : 1);
        const ringWidth = isSelected || isHovered ? 3 : 2;

        // Outer ring (main circle)
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected || isHovered || isConnected ? config.ring : config.color;
        ctx.lineWidth = ringWidth;
        ctx.stroke();

        // Inner fill - very subtle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius - ringWidth/2, 0, Math.PI * 2);
        ctx.fillStyle = isSelected || isHovered ? `${config.color}15` : 'rgba(8, 8, 16, 0.8)';
        ctx.fill();

        // Center dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = config.color;
        ctx.fill();

        // Selection indicator - outer dashed ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
          ctx.strokeStyle = config.ring;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.lineDashOffset = -time * 20;
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Label
        if (isSelected || isHovered || isConnected) {
          const label = node.id.length > 16 ? node.id.substring(0, 16) + '…' : node.id;
          ctx.font = '500 11px Inter, system-ui, sans-serif';
          const labelWidth = ctx.measureText(label).width + 14;
          const labelHeight = 22;
          const labelY = node.y + radius + 12;

          // Label background
          ctx.fillStyle = 'rgba(15, 15, 25, 0.95)';
          ctx.beginPath();
          ctx.roundRect(node.x - labelWidth/2, labelY, labelWidth, labelHeight, 4);
          ctx.fill();

          // Label border
          ctx.strokeStyle = `${config.color}50`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Label text
          ctx.fillStyle = '#e0e0e0';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, node.x, labelY + labelHeight/2);
        }
      });

      ctx.restore();

      // Minimap
      drawMinimap(ctx, width, height, nodes);

      animationRef.current = requestAnimationFrame(animate);
    };

    const drawMinimap = (ctx, width, height, nodes) => {
      const mapW = 100;
      const mapH = 70;
      const mapX = width - mapW - 12;
      const mapY = 12;

      // Background
      ctx.fillStyle = 'rgba(15, 15, 25, 0.9)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(mapX, mapY, mapW, mapH, 6);
      ctx.fill();
      ctx.stroke();

      // Nodes
      nodes.forEach(node => {
        const mx = mapX + 5 + (node.x / width) * (mapW - 10);
        const my = mapY + 5 + (node.y / height) * (mapH - 10);
        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, Math.PI * 2);
        ctx.fillStyle = node.config.color;
        ctx.fill();
      });

      // Viewport
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      const vpW = (mapW - 10) / zoom;
      const vpH = (mapH - 10) / zoom;
      ctx.strokeRect(
        mapX + 5 + (mapW - 10)/2 - vpW/2 - (offset.x/width) * (mapW - 10) / zoom,
        mapY + 5 + (mapH - 10)/2 - vpH/2 - (offset.y/height) * (mapH - 10) / zoom,
        vpW, vpH
      );
    };

    animate();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [data, zoom, offset, selectedNode, hoveredNode]);

  // Mouse handlers
  const getNodeAtPosition = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((clientX - rect.left) * scaleX - canvas.width/2 - offset.x) / zoom + canvas.width/2;
    const y = ((clientY - rect.top) * scaleY - canvas.height/2 - offset.y) / zoom + canvas.height/2;

    return nodesRef.current.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx*dx + dy*dy) < node.radius + 5;
    });
  }, [zoom, offset]);

  const handleMouseDown = (e) => {
    const node = getNodeAtPosition(e.clientX, e.clientY);
    if (node) {
      setSelectedNode(prev => prev?.id === node.id ? null : node);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else {
      setHoveredNode(getNodeAtPosition(e.clientX, e.clientY));
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.4, Math.min(3, z * (e.deltaY > 0 ? 0.9 : 1.1))));
  };

  // Connected nodes panel
  const connectedNodes = selectedNode ? data?.edges?.reduce((acc, edge) => {
    if (edge.source === selectedNode.id) {
      const node = data.nodes.find(n => n.id === edge.target);
      if (node) acc.push({ ...node, direction: 'out' });
    }
    if (edge.target === selectedNode.id) {
      const node = data.nodes.find(n => n.id === edge.source);
      if (node) acc.push({ ...node, direction: 'in' });
    }
    return acc;
  }, []) : [];

  const hasData = data?.nodes?.length > 0;

  return (
    <div className="graph-container">
      <div className="graph-header">
        <div className="header-title">
          <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/>
            <line x1="12" y1="8" x2="5" y2="16"/><line x1="12" y1="8" x2="19" y2="16"/>
          </svg>
          <div>
            <h3>Attack Graph</h3>
            <span className="subtitle">{data?.nodes?.length || 0} entities · {data?.edges?.length || 0} connections</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="zoom-display">{Math.round(zoom * 100)}%</div>
          <button onClick={() => setZoom(z => Math.min(3, z * 1.2))}>+</button>
          <button onClick={() => setZoom(z => Math.max(0.4, z * 0.8))}>−</button>
          <button onClick={() => { setZoom(1); setOffset({x:0,y:0}); setSelectedNode(null); }}>Reset</button>
        </div>
      </div>

      <div className="canvas-area">
        <canvas
          ref={canvasRef}
          width={800}
          height={550}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : hoveredNode ? 'pointer' : 'grab' }}
        />

        {/* Legend */}
        <div className="legend">
          {Object.entries(TYPE_CONFIG).map(([type, config]) => (
            <div key={type} className="legend-item">
              <span className="legend-ring" style={{ borderColor: config.color }}></span>
              <span>{config.label}</span>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        {selectedNode && (
          <div className="detail-panel">
            <div className="panel-head">
              <div className="node-indicator" style={{ borderColor: TYPE_CONFIG[selectedNode.type]?.color }}>
                <span style={{ background: TYPE_CONFIG[selectedNode.type]?.color }}></span>
              </div>
              <div className="node-info">
                <span className="node-type" style={{ color: TYPE_CONFIG[selectedNode.type]?.color }}>
                  {TYPE_CONFIG[selectedNode.type]?.label}
                </span>
                <span className="node-id">{selectedNode.id}</span>
              </div>
              <button className="close" onClick={() => setSelectedNode(null)}>×</button>
            </div>
            <div className="panel-content">
              <div className="section-title">
                Connections <span className="count">{connectedNodes.length}</span>
              </div>
              <div className="conn-list">
                {connectedNodes.map((node, i) => (
                  <div 
                    key={i} 
                    className="conn-item"
                    onClick={() => setSelectedNode(nodesRef.current.find(n => n.id === node.id))}
                  >
                    <span className="conn-ring" style={{ borderColor: TYPE_CONFIG[node.type]?.color }}>
                      <span style={{ background: TYPE_CONFIG[node.type]?.color }}></span>
                    </span>
                    <div className="conn-info">
                      <span className="conn-type">{TYPE_CONFIG[node.type]?.label}</span>
                      <span className="conn-id">{node.id.length > 20 ? node.id.substring(0,20)+'…' : node.id}</span>
                    </div>
                    <span className={`direction ${node.direction}`}>{node.direction === 'in' ? '←' : '→'}</span>
                  </div>
                ))}
                {connectedNodes.length === 0 && <div className="no-conn">No connections</div>}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasData && (
          <div className="empty-state">
            <div className="neural-icon">
              <svg viewBox="0 0 80 80">
                <circle cx="40" cy="15" r="8" fill="none" stroke="#1e90ff" strokeWidth="2"/>
                <circle cx="15" cy="55" r="8" fill="none" stroke="#2ed573" strokeWidth="2"/>
                <circle cx="65" cy="55" r="8" fill="none" stroke="#a55eea" strokeWidth="2"/>
                <line x1="40" y1="23" x2="20" y2="48" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
                <line x1="40" y1="23" x2="60" y2="48" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
                <line x1="23" y1="55" x2="57" y2="55" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
                <circle cx="40" cy="15" r="3" fill="#1e90ff"/>
                <circle cx="15" cy="55" r="3" fill="#2ed573"/>
                <circle cx="65" cy="55" r="3" fill="#a55eea"/>
              </svg>
            </div>
            <h4>No Graph Data</h4>
            <p>Process security alerts to build the threat network</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .graph-container {
          background: #0a0a12;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
        }

        .graph-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-icon {
          width: 36px;
          height: 36px;
          padding: 8px;
          background: rgba(30,144,255,0.1);
          border: 1px solid rgba(30,144,255,0.3);
          border-radius: 10px;
          color: #1e90ff;
        }

        h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #fff; }
        .subtitle { font-size: 0.7rem; color: #666; }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .zoom-display {
          padding: 0.4rem 0.75rem;
          background: rgba(255,255,255,0.05);
          border-radius: 6px;
          font-size: 0.7rem;
          color: #888;
          min-width: 48px;
          text-align: center;
        }

        .header-actions button {
          padding: 0.4rem 0.75rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          color: #888;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .header-actions button:hover {
          background: rgba(30,144,255,0.15);
          border-color: rgba(30,144,255,0.3);
          color: #1e90ff;
        }

        .canvas-area {
          position: relative;
        }

        canvas {
          display: block;
          width: 100%;
          height: auto;
        }

        .legend {
          position: absolute;
          bottom: 12px;
          left: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding: 0.6rem 0.9rem;
          background: rgba(10,10,18,0.95);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.6rem;
          color: #888;
        }

        .legend-ring {
          width: 10px;
          height: 10px;
          border: 2px solid;
          border-radius: 50%;
          background: transparent;
        }

        .detail-panel {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 260px;
          background: rgba(12,12,20,0.98);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
        }

        .panel-head {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.9rem;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .node-indicator {
          width: 32px;
          height: 32px;
          border: 2px solid;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(8,8,16,0.8);
        }
        .node-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .node-info { flex: 1; min-width: 0; }
        .node-type {
          display: block;
          font-size: 0.55rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .node-id {
          display: block;
          font-size: 0.75rem;
          color: #ccc;
          margin-top: 2px;
          word-break: break-all;
          font-family: 'JetBrains Mono', monospace;
        }

        .close {
          width: 24px;
          height: 24px;
          background: rgba(255,255,255,0.05);
          border: none;
          border-radius: 6px;
          color: #666;
          font-size: 1.1rem;
          cursor: pointer;
          line-height: 1;
        }
        .close:hover { background: rgba(255,80,80,0.2); color: #ff5050; }

        .panel-content { padding: 0.9rem; }

        .section-title {
          font-size: 0.6rem;
          font-weight: 600;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.6rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .count {
          background: rgba(30,144,255,0.15);
          color: #1e90ff;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-size: 0.55rem;
        }

        .conn-list {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          max-height: 240px;
          overflow-y: auto;
        }

        .conn-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .conn-item:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
        }

        .conn-ring {
          width: 24px;
          height: 24px;
          border: 2px solid;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(8,8,16,0.8);
          flex-shrink: 0;
        }
        .conn-ring span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .conn-info { flex: 1; min-width: 0; }
        .conn-type {
          display: block;
          font-size: 0.5rem;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
        }
        .conn-id {
          display: block;
          font-size: 0.65rem;
          color: #888;
          font-family: 'JetBrains Mono', monospace;
        }

        .direction {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          font-size: 0.75rem;
          flex-shrink: 0;
        }
        .direction.in { background: rgba(30,144,255,0.15); color: #1e90ff; }
        .direction.out { background: rgba(165,94,234,0.15); color: #a55eea; }

        .no-conn {
          text-align: center;
          padding: 1.5rem;
          color: #444;
          font-size: 0.75rem;
        }

        .empty-state {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .neural-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
        }
        .neural-icon svg { width: 100%; height: 100%; }

        .empty-state h4 {
          margin: 0 0 0.4rem;
          font-size: 1.1rem;
          font-weight: 500;
          color: #666;
        }
        .empty-state p {
          margin: 0;
          font-size: 0.8rem;
          color: #444;
        }
      `}</style>
    </div>
  );
}
