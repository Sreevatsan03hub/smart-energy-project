import React from 'react';
import { 
  LayoutDashboard, 
  LineChart, 
  AlertTriangle, 
  TrendingUp, 
  Coins, 
  Bot, 
  FileText,
  Sliders,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const NAVIGATION_ITEMS = [
  {
    id: 'overview',
    label: 'Overview Dashboard',
    icon: LayoutDashboard,
    badge: 'Live',
    badgeType: 'badge-green',
    description: 'Executive Command Center (F1, F2, F8, F9, F10)'
  },
  {
    id: 'forecasting',
    label: 'Adaptive Forecasting',
    icon: LineChart,
    badge: 'XGBoost',
    badgeType: 'badge-amber',
    description: '1-Hour Live Inference & Actual vs Pred (F1, F7)'
  },
  {
    id: 'anomalies',
    label: 'Anomaly Diagnostics',
    icon: AlertTriangle,
    badge: '3 Events',
    badgeType: 'badge-red',
    description: 'Context-Aware Residuals & Peak Analysis (F2, F4, F7)'
  },
  {
    id: 'analytics',
    label: 'Energy Analytics',
    icon: TrendingUp,
    badge: 'Diurnal',
    badgeType: 'badge-blue',
    description: 'Trends, Patterns & Similar Day Finder (F3, F5, F6)'
  },
  {
    id: 'optimization',
    label: 'Cost & Optimization',
    icon: Coins,
    badge: 'ROI',
    badgeType: 'badge-purple',
    description: 'Tariff Cost, Recommendations & Reports (F8, F10, F12)'
  }
];

export default function Sidebar({ activeTab, setActiveTab, onOpenCopilot }) {
  const { selectedRegion, isAdmin } = useAuth();

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid var(--border-card)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: 'calc(100vh - 64px)',
      position: 'sticky',
      top: '64px',
      boxShadow: 'var(--shadow-sm)',
      zIndex: 20
    }}>
      {/* Navigation List */}
      <div style={{ padding: '20px 14px' }}>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '0 10px 12px'
        }}>
          FACILITY INTELLIGENCE
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAVIGATION_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--eco-green-light)' : 'transparent',
                  color: isActive ? 'var(--eco-green-dark)' : 'var(--text-main)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  textAlign: 'left',
                  borderLeft: isActive ? '3px solid var(--eco-green)' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color={isActive ? 'var(--eco-green-dark)' : '#64748B'} />
                  <span>{item.label}</span>
                </div>

                <span className={`badge ${item.badgeType}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                  {item.badge}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Quick Launch Copilot Card */}
        <div style={{
          marginTop: '24px',
          background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
          border: '1px solid rgba(0, 179, 60, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          cursor: 'pointer'
        }}
        onClick={onOpenCopilot}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{
              background: 'var(--eco-green)',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={14} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--eco-green-dark)' }}>
              Energy Copilot AI
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#166534', margin: '0 0 8px 0', lineHeight: 1.3 }}>
            Ask natural language questions about forecasts, costs, or peak loads for {selectedRegion}.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--eco-green-dark)' }}>
            <span>Launch Assistant</span>
            <ChevronRight size={13} />
          </div>
        </div>
      </div>

      {/* Scope Footer Tag */}
      <div style={{
        padding: '14px 18px',
        borderTop: '1px solid var(--border-card)',
        backgroundColor: '#F8FAFC',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>Scope Mode:</span>
          <span style={{ fontWeight: 700, color: isAdmin ? 'var(--eco-navy)' : 'var(--eco-amber)' }}>
            {isAdmin ? 'ALL REGIONS' : selectedRegion}
          </span>
        </div>
        <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '3px' }}>
          Smart Energy OS v1.0 • 2026
        </div>
      </div>
    </aside>
  );
}
