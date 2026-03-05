import React, { useState, useRef, useEffect } from 'react';

const SAMPLE_QUERIES = [
  "Analyze high-severity incidents",
  "What IPs should we block?",
  "Summarize threat intel",
  "Current risk posture?",
  "Explain recent attack chain"
];

export default function SOCAssistant({ apiBase = 'http://localhost:8001' }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "I'm your SOC AI Assistant powered by Mistral. I can analyze incidents, explain threats, and provide investigation guidance. Ask me anything!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${apiBase}/api/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || 'No response received' }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ Error: ${err.message}. The AI model may be busy - please retry.`,
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assistant-container">
      <div className="header">
        <div className="status">
          <span className={`dot ${loading ? 'thinking' : 'online'}`} />
          <span>{loading ? 'Analyzing...' : 'Online'}</span>
        </div>
        <span className="powered">Powered by Mistral AI</span>
      </div>
      
      <div className="quick-actions">
        <span className="label">Quick:</span>
        {SAMPLE_QUERIES.map((query, idx) => (
          <button key={idx} onClick={() => sendMessage(query)} disabled={loading} className="quick-btn">
            {query.length > 20 ? query.substring(0, 20) + '...' : query}
          </button>
        ))}
      </div>

      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className={`bubble ${msg.role} ${msg.isError ? 'error' : ''}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="bubble assistant loading">
              <span className="dot-bounce" /><span className="dot-bounce" /><span className="dot-bounce" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="input-area">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about incidents, IOCs, or threats..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="send-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </form>
      
      <style jsx>{`
        .assistant-container {
          background: rgba(20, 20, 35, 0.8);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 500px;
        }
        .header {
          padding: 1rem 1.25rem;
          background: linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15));
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status { display: flex; align-items: center; gap: 0.5rem; color: #e0e0e0; font-size: 0.85rem; }
        .dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22c55e;
        }
        .dot.thinking { background: #eab308; animation: pulse 1s infinite; }
        .dot.online { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
        .powered { font-size: 0.7rem; color: #666; }
        .quick-actions {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          align-items: center;
        }
        .label { font-size: 0.7rem; color: #555; }
        .quick-btn {
          padding: 0.3rem 0.6rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #888;
          font-size: 0.65rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .quick-btn:hover:not(:disabled) { border-color: #00d4ff; color: #00d4ff; }
        .quick-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .messages::-webkit-scrollbar { width: 4px; }
        .messages::-webkit-scrollbar-track { background: transparent; }
        .messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .message { display: flex; }
        .message.user { justify-content: flex-end; }
        .message.assistant { justify-content: flex-start; }
        .bubble {
          max-width: 85%;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        .bubble.user {
          background: linear-gradient(135deg, #00d4ff, #7c3aed);
          color: #fff;
          border-radius: 12px 12px 0 12px;
        }
        .bubble.assistant {
          background: rgba(255,255,255,0.08);
          color: #e0e0e0;
          border-radius: 12px 12px 12px 0;
        }
        .bubble.error {
          background: rgba(239,68,68,0.2);
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.3);
        }
        .bubble.loading {
          display: flex;
          gap: 0.3rem;
          padding: 1rem;
        }
        .dot-bounce {
          width: 6px; height: 6px;
          background: #00d4ff;
          border-radius: 50%;
          animation: bounce 1s infinite;
        }
        .dot-bounce:nth-child(2) { animation-delay: 0.15s; }
        .dot-bounce:nth-child(3) { animation-delay: 0.3s; }
        .input-area {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .input-area input {
          flex: 1;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #e0e0e0;
          font-size: 0.85rem;
        }
        .input-area input:focus {
          outline: none;
          border-color: #00d4ff;
          box-shadow: 0 0 0 2px rgba(0,212,255,0.2);
        }
        .input-area input::placeholder { color: #555; }
        .send-btn {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #00d4ff, #7c3aed);
          border: none;
          border-radius: 12px;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 4px 20px rgba(0,212,255,0.4); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
