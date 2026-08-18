import React from 'react';
import { useAlert } from '../../context/AlertContext';
import { AlertTriangle, X, ArrowRight, Volume2, VolumeX } from 'lucide-react';

export default function AnomalyToast({ onNavigate }) {
  const { activeToast, dismissToast, isSoundEnabled, toggleSound } = useAlert();

  if (!activeToast) return null;

  const isCritical = activeToast.severity === 'CRITICAL';

  return (
    <div 
      style={{
        position: 'fixed',
        top: '80px',
        right: '24px',
        zIndex: 9999,
        width: '420px',
        maxWidth: '90vw',
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.25), 0 0 0 1px rgba(220, 38, 38, 0.25)',
        borderLeft: `6px solid ${isCritical ? '#DC2626' : '#D97706'}`,
        padding: '16px 18px',
        animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: isCritical ? '#FEE2E2' : '#FEF3C7',
            color: isCritical ? '#DC2626' : '#D97706',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex'
          }}>
            <AlertTriangle size={18} />
          </span>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
              {activeToast.title || 'Grid Anomaly Detected'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
              {activeToast.facilityName || `${activeToast.region} Grid`} • {activeToast.timestamp}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button 
            onClick={toggleSound}
            title={isSoundEnabled ? "Sound is ON (Click to Mute)" : "Sound is MUTED (Click to Unmute)"}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isSoundEnabled ? '#059669' : '#94A3B8',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button 
            onClick={dismissToast}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{
        fontSize: '0.82rem',
        color: '#334155',
        lineHeight: 1.4,
        background: isCritical ? '#FEF2F2' : '#FFFBEB',
        padding: '10px 12px',
        borderRadius: '8px',
        marginBottom: '12px',
        border: `1px solid ${isCritical ? '#FCA5A5' : '#FDE68A'}`
      }}>
        {activeToast.message || activeToast.rootCause}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isCritical ? '#DC2626' : '#D97706' }}>
          {activeToast.direction?.includes('Drop') ? `-${activeToast.deviationPct}% Drop` : `+${activeToast.deviationPct}% Surge`} ({activeToast.actualMW?.toLocaleString()} MW)
        </div>

        <button
          onClick={() => {
            if (onNavigate) onNavigate('anomalies');
            dismissToast();
          }}
          className="btn btn-navy btn-sm"
          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
        >
          <span>Inspect Root Cause</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
