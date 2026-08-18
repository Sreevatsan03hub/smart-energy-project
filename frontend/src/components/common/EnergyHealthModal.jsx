import React, { useState, useEffect } from 'react';
import { energyApi } from '../../services/api';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Flame, 
  Moon, 
  TrendingUp, 
  Cpu, 
  BarChart2 
} from 'lucide-react';

export default function EnergyHealthModal({ isOpen, onClose, region = 'PJME' }) {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    async function loadHealth() {
      setLoading(true);
      try {
        const data = await energyApi.getHealthScore(region);
        setHealthData(data);
      } catch (err) {
        console.error("Health score error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadHealth();
  }, [isOpen, region]);

  if (!isOpen) return null;

  const score = healthData?.overallScore || 75;
  const grade = healthData?.statusGrade || 'GOOD';
  const gradeLetter = healthData?.grade || 'A';
  const color = healthData?.statusColor || '#0B63E5';

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 37, 64, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '780px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0A2540 0%, #0F3A66 100%)',
          color: '#FFFFFF',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              padding: '10px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={22} color="var(--eco-green)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Facility Energy Health Index
                </h2>
                <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>FEATURE 9</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                Composite operational score & sub-indicator breakdown for {region} Grid
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Activity size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <div>Aggregating 5 operational sub-indices...</div>
            </div>
          ) : (
            <div>
              {/* Overall Score Header Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 179, 60, 0.08) 0%, rgba(11, 99, 229, 0.08) 100%)',
                border: '1px solid rgba(0, 179, 60, 0.25)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <div style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: `4px solid ${color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                  }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--eco-navy)', lineHeight: 1 }} className="font-mono">
                      {score}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>/ 100</span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--eco-navy)' }}>
                        Status: {grade}
                      </span>
                      <span className="badge badge-green" style={{ fontSize: '0.78rem' }}>
                        Grade {gradeLetter}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, maxWidth: '420px', lineHeight: 1.4 }}>
                      {healthData?.statusDescription}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>MONITORED REGION</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--eco-navy)' }}>{region} Grid</div>
                </div>
              </div>

              {/* 5 Sub-Scores Section */}
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--eco-navy)', marginBottom: '14px' }}>
                Operational Sub-Indicator Breakdown (100 Points Total)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {healthData?.subScores?.map((sub, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--border-card)',
                      borderRadius: '10px',
                      padding: '12px 16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--eco-navy)' }}>
                        {sub.name}
                      </span>
                      <span className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--eco-navy)' }}>
                        {sub.score} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/ {sub.maxScore} pts</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      height: '6px',
                      background: '#E2E8F0',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      marginBottom: '6px'
                    }}>
                      <div style={{
                        width: `${(sub.score / sub.maxScore) * 100}%`,
                        height: '100%',
                        background: (sub.score / sub.maxScore) >= 0.8 ? 'var(--eco-green)' : (sub.score / sub.maxScore) >= 0.6 ? 'var(--eco-amber)' : 'var(--eco-red)',
                        borderRadius: '3px',
                        transition: 'width 0.5s ease-out'
                      }} />
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {sub.description}
                    </div>
                  </div>
                ))}
              </div>

              {/* Positive Highlights & Risk Warnings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Positives */}
                <div style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#16A34A', fontWeight: 800, fontSize: '0.88rem' }}>
                    <CheckCircle2 size={16} />
                    <span>Positive Operational Strengths</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {healthData?.positiveFactors?.map((pos, idx) => (
                      <div key={idx} style={{ fontSize: '0.8rem', color: '#15803D', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.4 }}>
                        <span>✓</span>
                        <span>{pos}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risks / Areas for Attention */}
                <div style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#D97706', fontWeight: 800, fontSize: '0.88rem' }}>
                    <AlertTriangle size={16} />
                    <span>Areas Requiring Attention</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {healthData?.riskFactors?.length > 0 ? (
                      healthData.riskFactors.map((risk, idx) => (
                        <div key={idx} style={{ fontSize: '0.8rem', color: '#B45309', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.4 }}>
                          <span>⚠</span>
                          <span>{risk}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#B45309' }}>No critical operational risks detected.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-card)',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Calculated from 168-hour live telemetry, anomaly incident rates, and diurnal curve.
          </div>
          <button 
            onClick={onClose}
            className="btn btn-navy btn-sm"
            style={{ padding: '8px 18px' }}
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
