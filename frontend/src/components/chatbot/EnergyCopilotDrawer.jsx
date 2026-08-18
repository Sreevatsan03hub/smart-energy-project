import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { energyApi } from '../../services/api';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Zap,
  AlertTriangle,
  LineChart,
  Shield,
  Layers,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  Database,
  Cpu,
  Sliders,
  Award
} from 'lucide-react';

/**
 * Custom lightweight Markdown & Table parser for ChatGPT-style assistant messages
 * Theme: Light Eco-Green / Mint matching the sidebar card
 */
function FormattedMessage({ text, flowDiagram, source }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert markdown tables and text elements to HTML
  const renderFormattedContent = (content) => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements = [];
    let tableBuffer = [];
    let inTable = false;
    let listBuffer = [];
    let inList = false;

    const flushTable = () => {
      if (tableBuffer.length > 0) {
        const headerLine = tableBuffer[0];
        const bodyLines = tableBuffer.slice(2); // Skip separator row

        const headers = headerLine
          .split('|')
          .map(h => h.trim())
          .filter(h => h.length > 0);

        const rows = bodyLines.map(rowLine =>
          rowLine
            .split('|')
            .map(c => c.trim())
            .filter(c => c.length > 0)
        );

        elements.push(
          <div key={`table-${elements.length}`} style={{ overflowX: 'auto', margin: '12px 0' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.78rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(0, 179, 60, 0.25)',
              boxShadow: '0 1px 4px rgba(0, 179, 60, 0.08)'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#E2F7EB', borderBottom: '1px solid rgba(0, 179, 60, 0.25)' }}>
                  {headers.map((h, idx) => (
                    <th key={idx} style={{
                      padding: '8px 10px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#065F46',
                      letterSpacing: '0.02em'
                    }}>
                      <span dangerouslySetInnerHTML={{ __html: formatInline(h) }} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, rIdx) => (
                  <tr key={rIdx} style={{
                    borderBottom: '1px solid rgba(0, 179, 60, 0.1)',
                    backgroundColor: rIdx % 2 === 0 ? '#FFFFFF' : '#F6FDF9'
                  }}>
                    {r.map((cell, cIdx) => (
                      <td key={cIdx} style={{
                        padding: '7px 10px',
                        color: '#14532D'
                      }}>
                        <span dangerouslySetInnerHTML={{ __html: formatInline(cell) }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableBuffer = [];
        inTable = false;
      }
    };

    const flushList = () => {
      if (listBuffer.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} style={{ margin: '8px 0 8px 18px', padding: 0 }}>
            {listBuffer.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '4px', color: '#166534', fontSize: '0.82rem' }}>
                <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
              </li>
            ))}
          </ul>
        );
        listBuffer = [];
        inList = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Table line detection
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (inList) flushList();
        inTable = true;
        tableBuffer.push(trimmed);
        return;
      } else if (inTable) {
        flushTable();
      }

      // List item detection
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        inList = true;
        listBuffer.push(trimmed.substring(2));
        return;
      } else if (inList && trimmed.length > 0 && !trimmed.startsWith('#')) {
        listBuffer.push(trimmed);
        return;
      } else if (inList) {
        flushList();
      }

      // Headings
      if (trimmed.startsWith('#### ')) {
        elements.push(
          <h5 key={idx} style={{ margin: '10px 0 4px 0', fontSize: '0.85rem', fontWeight: 700, color: '#047857' }}>
            <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.substring(5)) }} />
          </h5>
        );
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={idx} style={{ margin: '12px 0 6px 0', fontSize: '0.92rem', fontWeight: 700, color: '#065F46' }}>
            <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.substring(4)) }} />
          </h4>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={idx} style={{ margin: '14px 0 8px 0', fontSize: '1rem', fontWeight: 800, color: '#064E3B' }}>
            <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.substring(3)) }} />
          </h3>
        );
      } else if (trimmed.startsWith('> ')) {
        elements.push(
          <div key={idx} style={{
            margin: '8px 0',
            padding: '8px 12px',
            backgroundColor: '#E8F9F0',
            borderLeft: '3px solid #00B33C',
            borderRadius: '0 6px 6px 0',
            fontSize: '0.78rem',
            color: '#065F46'
          }}>
            <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.substring(2)) }} />
          </div>
        );
      } else if (trimmed.length > 0) {
        elements.push(
          <p key={idx} style={{ margin: '6px 0', fontSize: '0.82rem', lineHeight: '1.5', color: '#166534' }}>
            <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
          </p>
        );
      }
    });

    if (inTable) flushTable();
    if (inList) flushList();

    return elements;
  };

  const formatInline = (str) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #064E3B; font-weight: 700;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color: #047857;">$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background: #E8F8F0; color: #047857; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.85em; border: 1px solid rgba(0, 179, 60, 0.25); font-weight: 600;">$1</code>');
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ paddingRight: '24px' }}>
        {renderFormattedContent(text)}
      </div>

      {/* Visual Pipeline Flowchart */}
      {flowDiagram && flowDiagram.nodes && (
        <div style={{
          marginTop: '14px',
          marginBottom: '14px',
          padding: '14px',
          backgroundColor: '#EBFBF3',
          borderRadius: '10px',
          border: '1px solid rgba(0, 179, 60, 0.35)',
          boxShadow: '0 2px 10px rgba(0, 179, 60, 0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#065F46',
            fontWeight: 700,
            fontSize: '0.78rem',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Layers size={14} color="#00B33C" />
            <span>Interactive System Connectivity Flow</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {flowDiagram.nodes.map((node, nIdx) => (
              <React.Fragment key={node.id}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: node.type === 'model'
                    ? '1.5px solid #00B33C'
                    : node.type === 'output'
                    ? '1.5px solid #F59E0B'
                    : '1px solid rgba(0, 179, 60, 0.25)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: node.type === 'model' ? '#00B33C' : node.type === 'output' ? '#F59E0B' : '#10B981',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 800
                  }}>
                    {node.id}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#064E3B', fontWeight: 700, fontSize: '0.8rem' }}>
                      {node.label}
                    </div>
                    <div style={{ color: '#059669', fontSize: '0.7rem' }}>
                      {node.detail}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: node.type === 'model' ? '#E8F8F0' : node.type === 'output' ? '#FEF3C7' : '#F0FDF4',
                    color: node.type === 'model' ? '#065F46' : node.type === 'output' ? '#B45309' : '#047857',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    border: '1px solid rgba(0, 179, 60, 0.2)'
                  }}>
                    {node.type}
                  </span>
                </div>

                {nIdx < flowDiagram.nodes.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
                    <div style={{
                      width: '2px',
                      height: '10px',
                      backgroundColor: 'rgba(0, 179, 60, 0.4)'
                    }} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Verified Source Indicator */}
      {source && (
        <div style={{
          marginTop: '10px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(0, 179, 60, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.68rem',
          color: '#059669'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Shield size={12} color="#00B33C" />
            <span>Verified Source: <strong style={{ color: '#064E3B' }}>{source}</strong></span>
          </div>

          <button
            onClick={handleCopy}
            title="Copy response"
            style={{
              background: 'transparent',
              border: 'none',
              color: copied ? '#00B33C' : '#059669',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 600
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function EnergyCopilotDrawer({ isOpen, onClose }) {
  const { selectedRegion, currentUser, isAdmin, isRegionalUser } = useAuth();
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hello! I am your **Smart Energy AI Copilot** for the **${selectedRegion}** grid.\n\nI have real-time access to the **11 regional XGBoost models**, **Isolation Forest anomaly scores**, **multi-year historical patterns**, and **telemetry datasets**.\n\nI can dynamically analyze any question you ask about the data. How can I help you today?`,
      source: "Smart Energy Management OS — Verified Data & ML Core"
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // When active region changes, add an informative message to the thread
  useEffect(() => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'bot',
        text: `Switched contextual focus to **${selectedRegion}** grid. All subsequent data queries, statistical analyses, and model diagnostics are scoped to ${selectedRegion}.`,
        source: `Regional Scope: ${selectedRegion}`
      }
    ]);
  }, [selectedRegion]);

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: `Chat reset. Active scope is **${selectedRegion}** grid. Ask any question to analyze load data, forecasts, anomalies, or statistics.`,
        source: "Smart Energy OS Core"
      }
    ]);
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Pass user role and assigned region for strict pre-retrieval RBAC
      const response = await energyApi.askCopilot(
        text,
        selectedRegion,
        currentUser?.role || 'admin',
        currentUser?.assignedRegion || 'ALL',
        messages.slice(-6)
      );

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.answer,
        source: response.source || "Smart Energy Backend",
        flowDiagram: response.flow_diagram
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: `⚠️ **Connection Error**: Unable to retrieve verified data from the analytics server. Please ensure the FastAPI backend is online at port 8000.`,
          source: "Backend Connectivity Error"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(6, 44, 29, 0.45)',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '520px',
        maxWidth: '94vw',
        height: '100%',
        backgroundColor: '#EBFBF3',
        boxShadow: '-8px 0 36px rgba(0, 70, 30, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '2px solid #00B33C',
        color: '#14532D'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#E0F7EB',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0, 179, 60, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: '#00B33C',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 179, 60, 0.35)'
            }}>
              <Bot size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#064E3B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Energy AI Copilot</span>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 179, 60, 0.15)',
                  color: '#065F46',
                  border: '1px solid rgba(0, 179, 60, 0.3)',
                  fontWeight: 700
                }}>
                  Data Analytics Core
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span>Scope: <strong style={{ color: '#00872E' }}>{selectedRegion} Facility</strong></span>
                <span>•</span>
                <span>Role: <strong style={{ color: isAdmin ? '#B45309' : '#047857' }}>{isAdmin ? 'Central Admin' : 'Local Operator'}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={handleClearChat}
              title="Reset conversation"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#059669',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#059669',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: '#EBFBF3'
        }}>
          {messages.map(msg => (
            <div 
              key={msg.id} 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '92%',
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: msg.sender === 'user'
                  ? '#00B33C'
                  : '#FFFFFF',
                color: msg.sender === 'user' ? '#FFFFFF' : '#14532D',
                boxShadow: msg.sender === 'user'
                  ? '0 4px 14px rgba(0, 179, 60, 0.3)'
                  : '0 2px 10px rgba(0, 80, 30, 0.06)',
                border: msg.sender === 'user'
                  ? 'none'
                  : '1px solid rgba(0, 179, 60, 0.25)',
                borderTopLeftRadius: msg.sender === 'bot' ? '2px' : '12px',
                borderTopRightRadius: msg.sender === 'user' ? '2px' : '12px'
              }}>
                {msg.sender === 'user' ? (
                  <div style={{ fontSize: '0.85rem', lineHeight: '1.45', fontWeight: 600 }}>
                    {msg.text}
                  </div>
                ) : (
                  <FormattedMessage
                    text={msg.text}
                    flowDiagram={msg.flowDiagram}
                    source={msg.source}
                  />
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              color: '#065F46',
              fontSize: '0.78rem',
              padding: '12px 16px',
              backgroundColor: '#E2F7EB',
              borderRadius: '8px',
              border: '1px solid rgba(0, 179, 60, 0.2)'
            }}>
              <span className="pulse-dot green" />
              <span>Analyzing telemetry datasets & computing statistics...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div style={{
          padding: '16px',
          backgroundColor: '#E0F7EB',
          borderTop: '1px solid rgba(0, 179, 60, 0.2)'
        }}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ display: 'flex', gap: '10px' }}
          >
            <input
              type="text"
              placeholder={`Ask any question to analyze load data, forecasts, anomalies, or statistics...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{
                flex: 1,
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(0, 179, 60, 0.35)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#064E3B',
                outline: 'none',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
              }}
              onFocus={(e) => e.target.style.borderColor = '#00B33C'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0, 179, 60, 0.35)'}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                background: !inputValue.trim() || isLoading
                  ? 'rgba(0, 179, 60, 0.2)'
                  : '#00B33C',
                border: 'none',
                color: '#FFFFFF',
                cursor: !inputValue.trim() || isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 179, 60, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              <Send size={16} />
            </button>
          </form>
          
          <div style={{
            fontSize: '0.68rem',
            color: '#059669',
            textAlign: 'center',
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <Shield size={11} color="#00B33C" />
            <span>Strict Zero-Hallucination Grounding • 11 Regional Grids Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
