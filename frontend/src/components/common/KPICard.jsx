import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function KPICard({
  title,
  value,
  unit,
  subtitle,
  trend,
  trendPositiveIsGood = true,
  icon: Icon,
  badgeText,
  badgeType = 'badge-blue',
  accentColor = 'var(--eco-blue)',
  onClick
}) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  // Determine delta color based on whether an increase is good (e.g. Health Score) or bad (e.g. Anomaly Count / Load Spike)
  let trendColor = 'var(--text-muted)';
  if (trend !== undefined && trend !== null) {
    if (isPositive) {
      trendColor = trendPositiveIsGood ? 'var(--eco-green)' : 'var(--eco-red)';
    } else if (isNegative) {
      trendColor = trendPositiveIsGood ? 'var(--eco-red)' : 'var(--eco-green)';
    }
  }

  return (
    <div 
      className="eco-card" 
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: `4px solid ${accentColor}`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>

        {Icon && (
          <div style={{
            background: 'var(--bg-subtle)',
            padding: '7px',
            borderRadius: '6px',
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--eco-navy)', letterSpacing: '-0.02em' }} className="font-mono">
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            {unit}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
        {subtitle && (
          <span style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </span>
        )}

        {trend !== undefined && trend !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: trendColor }}>
            {isPositive ? <ArrowUpRight size={14} /> : isNegative ? <ArrowDownRight size={14} /> : <Minus size={14} />}
            <span>{isPositive ? `+${trend}%` : `${trend}%`}</span>
          </div>
        )}

        {badgeText && (
          <span className={`badge ${badgeType}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
