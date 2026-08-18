import React from 'react';
import { Download, Maximize2 } from 'lucide-react';

export default function ChartCard({
  title,
  subtitle,
  badge,
  badgeType = 'badge-blue',
  timeframes,
  activeTimeframe,
  onTimeframeChange,
  children,
  actionButton,
  footerNote
}) {
  return (
    <div className="eco-card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="eco-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="eco-card-title">{title}</h3>
            {badge && <span className={`badge ${badgeType}`}>{badge}</span>}
          </div>
          {subtitle && <p className="eco-card-subtitle">{subtitle}</p>}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {timeframes && (
            <div style={{
              display: 'flex',
              background: '#F1F5F9',
              padding: '2px',
              borderRadius: '6px',
              gap: '2px'
            }}>
              {timeframes.map(tf => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange && onTimeframeChange(tf)}
                  style={{
                    border: 'none',
                    background: activeTimeframe === tf ? '#FFFFFF' : 'transparent',
                    color: activeTimeframe === tf ? 'var(--eco-navy)' : 'var(--text-muted)',
                    fontWeight: activeTimeframe === tf ? 700 : 500,
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    boxShadow: activeTimeframe === tf ? 'var(--shadow-sm)' : 'none',
                    transition: 'var(--transition)'
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}

          {actionButton}
        </div>
      </div>

      {/* Chart Canvas Body */}
      <div style={{ flex: 1, minHeight: '280px', position: 'relative' }}>
        {children}
      </div>

      {/* Footer Note */}
      {footerNote && (
        <div style={{
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid #F1F5F9',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{footerNote}</span>
          <span style={{ fontWeight: 600, color: 'var(--eco-green-dark)' }}>Live Ingestion Stream Active</span>
        </div>
      )}
    </div>
  );
}
