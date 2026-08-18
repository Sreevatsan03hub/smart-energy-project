import React, { useState, useEffect } from 'react';
import { energyApi } from '../../services/api';
import { 
  Sparkles, 
  X, 
  HelpCircle, 
  TrendingUp, 
  AlertTriangle, 
  Layers, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2,
  Sliders,
  Zap,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function ExplainabilityModal({ isOpen, onClose, defaultMode = 'FORECAST', region = 'PJME', anomalyId = null }) {
  const [activeTab, setActiveTab] = useState(defaultMode);
  const [forecastExp, setForecastExp] = useState(null);
  const [anomalyExp, setAnomalyExp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (defaultMode) {
      setActiveTab(defaultMode);
    }
  }, [defaultMode]);

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      setLoading(true);
      try {
        const [fc, ano] = await Promise.all([
          energyApi.getForecastExplainability(region).catch(() => null),
          energyApi.getAnomalyExplainability(region, anomalyId).catch(() => null)
        ]);
        setForecastExp(fc);
        setAnomalyExp(ano);
      } catch (err) {
        console.error("Explainability load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen, region, anomalyId]);

  if (!isOpen) return null;

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
          width: '840px',
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
              <Sparkles size={22} color="#00E5FF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  AI Explainability Engine
                </h2>
                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>FEATURE 7</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                Transparent glass-box deconstruction of model decisions & anomaly alerts for {region}
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

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-card)',
          backgroundColor: '#F8FAFC',
          padding: '0 24px'
        }}>
          <button
            onClick={() => setActiveTab('FORECAST')}
            style={{
              padding: '14px 20px',
              fontSize: '0.88rem',
              fontWeight: 700,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'FORECAST' ? 'var(--eco-navy)' : 'var(--text-muted)',
              borderBottom: activeTab === 'FORECAST' ? '3px solid var(--eco-blue)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <TrendingUp size={16} color={activeTab === 'FORECAST' ? 'var(--eco-blue)' : 'currentColor'} />
            <span>Why was this Forecast Made?</span>
          </button>

          <button
            onClick={() => setActiveTab('ANOMALY')}
            style={{
              padding: '14px 20px',
              fontSize: '0.88rem',
              fontWeight: 700,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'ANOMALY' ? 'var(--eco-red)' : 'var(--text-muted)',
              borderBottom: activeTab === 'ANOMALY' ? '3px solid var(--eco-red)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={16} color={activeTab === 'ANOMALY' ? 'var(--eco-red)' : 'currentColor'} />
            <span>Why was this Anomaly Flagged?</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Activity size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <div>Computing mathematical feature contributions...</div>
            </div>
          ) : activeTab === 'FORECAST' ? (
            /* FORECAST EXPLANATION VIEW */
            <div>
              {/* Target Summary Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(11, 99, 229, 0.08) 0%, rgba(0, 179, 60, 0.08) 100%)',
                border: '1px solid rgba(11, 99, 229, 0.2)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--eco-blue)', textTransform: 'uppercase' }}>
                      Predicted Load Target
                    </span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--eco-navy)' }} className="font-mono">
                      {forecastExp?.predictedLoadMW?.toLocaleString()} MW
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-green" style={{ fontSize: '0.8rem' }}>
                      R² {forecastExp?.modelR2} • MAE {forecastExp?.modelMAE} MW
                    </span>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Delta vs Baseline: <strong style={{ color: forecastExp?.deltaPct >= 0 ? 'var(--eco-green-dark)' : 'var(--eco-blue)' }}>{forecastExp?.deltaPct > 0 ? `+${forecastExp?.deltaPct}%` : `${forecastExp?.deltaPct}%`}</strong>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
                  {forecastExp?.summary}
                </p>
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--eco-navy)', marginBottom: '12px' }}>
                Key Influential Factors & Mathematical Weights
              </h4>

              {/* Contributing Factors List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {forecastExp?.contributingFactors?.map((factor, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--border-card)',
                      borderRadius: '10px',
                      padding: '14px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: 'var(--bg-canvas)',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          color: 'var(--text-main)'
                        }}>
                          #{idx + 1}
                        </span>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--eco-navy)' }}>{factor.factor}</strong>
                        <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>{factor.category}</span>
                      </div>
                      <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--eco-blue)' }}>
                        {factor.importancePct}% Weight
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      height: '6px',
                      background: '#E2E8F0',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        width: `${Math.min(100, factor.importancePct * 1.3)}%`,
                        height: '100%',
                        background: idx === 0 ? 'var(--eco-blue)' : idx === 1 ? 'var(--eco-green)' : 'var(--eco-amber)',
                        borderRadius: '3px'
                      }} />
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      {factor.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ANOMALY EXPLANATION VIEW */
            <div>
              {/* Anomaly Header Card */}
              <div style={{
                background: anomalyExp?.severity === 'CRITICAL' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(217, 119, 6, 0.08)',
                border: `1px solid ${anomalyExp?.severity === 'CRITICAL' ? 'rgba(220, 38, 38, 0.25)' : 'rgba(217, 119, 6, 0.25)'}`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--eco-red)', textTransform: 'uppercase' }}>
                      Flagged Anomaly Classification
                    </span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--eco-navy)' }}>
                      {anomalyExp?.direction}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${anomalyExp?.severity === 'CRITICAL' ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: '0.82rem' }}>
                      {anomalyExp?.severity} • Z = {anomalyExp?.zScore}
                    </span>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Confidence: <strong>{anomalyExp?.confidenceScore}%</strong>
                    </div>
                  </div>
                </div>

                {/* Actual vs Expected Comparison Pill Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-card)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Actual Measured Load</div>
                    <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--eco-navy)' }}>
                      {anomalyExp?.actualMW?.toLocaleString()} MW
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-card)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>AI Predicted Baseline</div>
                    <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--eco-blue)' }}>
                      {anomalyExp?.expectedMW?.toLocaleString()} MW
                    </div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-card)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Residual Deviation</div>
                    <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--eco-red)' }}>
                      {anomalyExp?.residualMW > 0 ? `+${anomalyExp?.deviationPct}%` : `-${anomalyExp?.deviationPct}%`}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
                  {anomalyExp?.physicsExplanation}
                </p>
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--eco-navy)', marginBottom: '12px' }}>
                Statistical & Contextual Contributing Factors
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {anomalyExp?.contributingFactors?.map((factor, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--border-card)',
                      borderRadius: '10px',
                      padding: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--eco-navy)' }}>{factor.factor}</strong>
                      <span className={`badge ${factor.significance === 'Extreme' ? 'badge-red' : 'badge-amber'}`}>
                        {factor.significance} Significance
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      <span>Measured: <strong style={{ color: 'var(--text-main)' }}>{factor.value}</strong></span>
                      <span>Threshold: <strong>{factor.threshold}</strong></span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      {factor.description}
                    </p>
                  </div>
                ))}
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
            ✅ Explainability validated against regional Gradient Boosted Trees & Isolation Forests.
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
