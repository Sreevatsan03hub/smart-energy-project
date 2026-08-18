import React, { useState } from 'react';
import { useAuth, DEMO_PERSONAS } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { REGIONS_META } from '../../services/constants';
import { 
  Building2, 
  ChevronDown, 
  Lock, 
  Activity, 
  DollarSign, 
  Bot, 
  LogOut, 
  ShieldCheck, 
  Zap,
  RefreshCw,
  Volume2,
  VolumeX
} from 'lucide-react';

export default function Navbar({ onOpenCopilot, onRefresh }) {
  const { isSoundEnabled, toggleSound } = useAlert();
  const { 
    currentUser, 
    selectedRegion, 
    setSelectedRegion, 
    isAdmin, 
    availableRegions, 
    tariffRate, 
    setTariffRate, 
    logout,
    switchPersona
  } = useAuth();

  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showTariffModal, setShowTariffModal] = useState(false);
  const [tempTariff, setTempTariff] = useState(tariffRate);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const meta = REGIONS_META[selectedRegion] || REGIONS_META.PJME;

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleSaveTariff = (e) => {
    e.preventDefault();
    setTariffRate(Number(tempTariff) || 8.0);
    setShowTariffModal(false);
  };

  return (
    <header style={{
      backgroundColor: 'var(--eco-navy)',
      color: '#FFFFFF',
      borderBottom: '3px solid var(--eco-green)',
      padding: '0 16px',
      height: '64px',
      minHeight: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 2px 8px rgba(10, 37, 64, 0.15)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'var(--eco-green)',
            color: '#FFFFFF',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Zap size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', color: '#FFFFFF' }}>SmartEnergy OS</span>
              <span style={{ fontSize: '0.65rem', background: 'rgba(0,179,60,0.25)', color: 'var(--eco-green)', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>AI PLATFORM</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 500, whiteSpace: 'nowrap' }}>
              AI Building Energy & Anomaly Management
            </div>
          </div>
        </div>

        <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />

        {/* Live Grid Health Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,255,255,0.06)',
          padding: '3px 10px',
          borderRadius: '20px',
          fontSize: '0.74rem',
          border: '1px solid rgba(255,255,255,0.1)',
          whiteSpace: 'nowrap'
        }}>
          <span className="pulse-dot green" />
          <span style={{ color: '#E2E8F0', fontWeight: 500 }}>11 Subnodes Online</span>
        </div>
      </div>

      {/* Control Actions (Region Selector, Tariff, Copilot, User) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        
        {/* Region Selector with RBAC Lockdown Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {isAdmin ? 'Facility:' : 'Assigned:'}
          </label>

          {isAdmin ? (
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{
                backgroundColor: '#FFFFFF',
                color: 'var(--eco-navy)',
                fontWeight: 700,
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                maxWidth: '220px',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {availableRegions.map(code => (
                <option key={code} value={code}>
                  {code} — {REGIONS_META[code]?.name || code} ({REGIONS_META[code]?.state})
                </option>
              ))}
            </select>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(217, 119, 6, 0.15)',
              border: '1px solid rgba(217, 119, 6, 0.4)',
              color: '#FDE68A',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 700
            }}>
              <Lock size={13} />
              <span>{selectedRegion} ({meta.name})</span>
            </div>
          )}
        </div>

        {/* Manual Refresh Data Button */}
        <button 
          onClick={handleRefresh}
          title="Refresh Grid Stream"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#FFFFFF',
            borderRadius: '6px',
            padding: '5px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition)',
            flexShrink: 0
          }}
        >
          <RefreshCw size={14} style={{ transform: isRefreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s' }} />
        </button>

        {/* Tariff Rate Chip */}
        <button 
          onClick={() => setShowTariffModal(true)}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#E2E8F0',
            borderRadius: '6px',
            padding: '5px 8px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
        >
          <DollarSign size={13} color="var(--eco-green)" />
          <span>${tariffRate.toFixed(2)}/kWh</span>
        </button>

        {/* Audio Alert Sound Toggle */}
        <button 
          onClick={toggleSound}
          title={isSoundEnabled ? "Anomaly Sound Alerts: ON (Click to Mute)" : "Anomaly Sound Alerts: MUTED (Click to Enable)"}
          style={{
            background: isSoundEnabled ? 'rgba(0, 179, 60, 0.15)' : 'rgba(255,255,255,0.08)',
            border: isSoundEnabled ? '1px solid rgba(0, 179, 60, 0.4)' : '1px solid rgba(255,255,255,0.15)',
            color: isSoundEnabled ? 'var(--eco-green)' : '#94A3B8',
            borderRadius: '6px',
            padding: '5px 8px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'var(--transition)',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
        >
          {isSoundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          <span>{isSoundEnabled ? 'Audio ON' : 'Muted'}</span>
        </button>

        {/* Floating Copilot Launcher Button */}
        <button 
          onClick={onOpenCopilot}
          style={{
            background: 'var(--eco-green)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 6px rgba(0, 179, 60, 0.4)',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
        >
          <Bot size={15} />
          <span>AI Copilot</span>
        </button>

        {/* User Persona & Role Selector Menu */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button 
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              padding: '4px 8px',
              color: '#FFFFFF',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{currentUser?.avatar || '👤'}</span>
            <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                {currentUser?.name?.startsWith('Dr.') ? 'Dr. Rachel' : currentUser?.name?.split(' ')[0] || 'User'}
              </div>
              <div style={{ fontSize: '0.62rem', color: isAdmin ? 'var(--eco-green)' : '#F59E0B', fontWeight: 700, textTransform: 'uppercase' }}>
                {isAdmin ? 'ADMIN' : `${currentUser?.assignedRegion} OPR`}
              </div>
            </div>
            <ChevronDown size={12} color="#94A3B8" style={{ flexShrink: 0 }} />
          </button>

          {/* Switch Persona Dropdown */}
          {showPersonaMenu && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: 0,
              width: '290px',
              maxHeight: '360px',
              overflowY: 'auto',
              backgroundColor: '#FFFFFF',
              color: 'var(--text-main)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-card)',
              zIndex: 50,
              padding: '8px'
            }}>
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #F1F5F9', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                SWITCH DEMO PERSONA (RBAC TEST)
              </div>

              {DEMO_PERSONAS.map(persona => (
                <button
                  key={persona.id}
                  onClick={() => {
                    switchPersona(persona.id);
                    setShowPersonaMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: currentUser?.id === persona.id ? 'var(--eco-green-light)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: currentUser?.id === persona.id ? 'var(--eco-green-dark)' : 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: currentUser?.id === persona.id ? 700 : 500
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{persona.avatar}</span>
                  <div style={{ flex: 1 }}>
                    <div>{persona.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{persona.badgeLabel}</div>
                  </div>
                </button>
              ))}

              <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '6px', paddingTop: '6px' }}>
                <button
                  onClick={logout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#FEE2E2',
                    color: 'var(--eco-red)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modal for Configuring Tariff */}
      {showTariffModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(10, 37, 64, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            background: '#FFFFFF',
            padding: '24px',
            borderRadius: '12px',
            width: '380px',
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--eco-navy)', marginBottom: '8px' }}>
              Configure Electricity Tariff
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Financial cost impact across all 11 regions is dynamically computed using this billing rate.
            </p>

            <form onSubmit={handleSaveTariff}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Commercial Base Tariff ($ / kWh)
                </label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={tempTariff}
                  onChange={(e) => setTempTariff(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', fontSize: '1rem', fontWeight: 700 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowTariffModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Tariff Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
