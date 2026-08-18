import React, { useState } from 'react';
import { useAuth, DEMO_PERSONAS } from '../context/AuthContext';
import { Zap, ShieldCheck, Lock, User, ArrowRight, Activity, Server, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = login(username, password);
    if (!res.success) {
      setError(res.message);
    }
  };

  const handleQuickPersona = (personaUsername) => {
    setUsername(personaUsername);
    setPassword('demo123');
    login(personaUsername, 'demo123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0A2540',
      backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(0, 179, 60, 0.12) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(11, 99, 229, 0.15) 0%, transparent 40%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'inherit'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Top Header Banner */}
        <div style={{
          backgroundColor: '#071A2E',
          padding: '28px 32px',
          borderBottom: '3px solid var(--eco-green)',
          color: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              background: 'var(--eco-green)',
              color: '#FFFFFF',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={26} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>SmartEnergy OS</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500 }}>
                Smart Building Energy & Anomaly Management
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.4, margin: 0 }}>
            Enterprise AI platform for 1-hour energy forecasting, context-aware anomaly detection & facility cost optimization.
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--eco-navy)', margin: '0 0 4px 0' }}>
              Sign In to Energy Grid
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Authenticate with your enterprise credentials or select a persona.
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #F87171',
              color: '#B91C1C',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Username / Regional ID
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '36px' }}
                  placeholder="e.g. admin or pjme_user"
                  required
                />
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '36px' }}
                  placeholder="••••••••••••"
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '11px', fontSize: '0.95rem', marginTop: '6px' }}
            >
              <span>Access Energy Dashboard</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Persona Switcher for Hackathons */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-card)' }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              ⚡ Quick Demo Personas (1-Click Login)
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              maxHeight: '220px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {DEMO_PERSONAS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleQuickPersona(p.username)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-card)',
                    backgroundColor: '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--eco-green-light)';
                    e.currentTarget.style.borderColor = 'rgba(0,179,60,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                    e.currentTarget.style.borderColor = 'var(--border-card)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--eco-navy)' }}>
                    <span>{p.avatar}</span>
                    <span>{p.username}</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {p.role === 'admin' ? 'All 11 Grids' : `${p.assignedRegion} Grid only`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security & System Info Footer */}
        <div style={{
          backgroundColor: '#F8FAFC',
          padding: '12px 24px',
          borderTop: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={14} color="var(--eco-green)" />
            <span>Role-Based Regional Access Control</span>
          </div>
          <span>v1.0.0-Prod</span>
        </div>
      </div>
    </div>
  );
}
