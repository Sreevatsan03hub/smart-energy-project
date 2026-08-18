import React, { useState, useEffect } from 'react';
import { energyApi } from '../../services/api';
import { 
  Compass, 
  X, 
  Clock, 
  Calendar, 
  Sun, 
  Layers, 
  TrendingUp, 
  ArrowRight, 
  Flame, 
  Activity,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function HistoricalPatternsModal({ isOpen, onClose, region = 'PJME' }) {
  const [activeTab, setActiveTab] = useState('HOURLY');
  const [hourlyData, setHourlyData] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [weekendData, setWeekendData] = useState(null);
  const [patternSummary, setPatternSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    async function loadPatterns() {
      setLoading(true);
      try {
        const [hourly, daily, monthly, ww, summary] = await Promise.all([
          energyApi.getHourlyPattern(region).catch(() => null),
          energyApi.getDailyPattern(region).catch(() => null),
          energyApi.getMonthlyPattern(region).catch(() => null),
          energyApi.getWeekdayWeekendPattern(region).catch(() => null),
          energyApi.getPatternSummary(region).catch(() => null)
        ]);

        setHourlyData(hourly);
        setDailyData(daily);
        setMonthlyData(monthly);
        setWeekendData(ww);
        setPatternSummary(summary);
      } catch (err) {
        console.error("Pattern load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPatterns();
  }, [isOpen, region]);

  if (!isOpen) return null;

  // 1. Hourly Diurnal Baseline with 1-Sigma Confidence Bands
  const hourlyChartData = {
    labels: (hourlyData?.data || []).map(d => d.label),
    datasets: [
      {
        label: 'Upper Bound (+1σ Variation)',
        data: (hourlyData?.data || []).map(d => d.band_upper_mw),
        borderColor: 'rgba(11, 99, 229, 0.25)',
        backgroundColor: 'transparent',
        borderDash: [3, 3],
        pointRadius: 0,
        borderWidth: 1.5,
        fill: false
      },
      {
        label: 'Mean Baseline Demand',
        data: (hourlyData?.data || []).map(d => d.average_mw),
        borderColor: '#0B63E5',
        backgroundColor: 'rgba(11, 99, 229, 0.12)',
        borderWidth: 3,
        pointRadius: 3,
        pointBackgroundColor: '#0B63E5',
        fill: '+1', // Fill down to lower bound
        tension: 0.35
      },
      {
        label: 'Lower Bound (-1σ Variation)',
        data: (hourlyData?.data || []).map(d => d.band_lower_mw),
        borderColor: 'rgba(11, 99, 229, 0.25)',
        backgroundColor: 'rgba(11, 99, 229, 0.08)',
        borderDash: [3, 3],
        pointRadius: 0,
        borderWidth: 1.5,
        fill: false
      }
    ]
  };

  // 2. Day-of-Week Chart Data
  const dailyChartData = {
    labels: (dailyData?.data || []).map(d => d.day_name),
    datasets: [
      {
        type: 'bar',
        label: 'Average Consumption (MW)',
        data: (dailyData?.data || []).map(d => d.average_mw),
        backgroundColor: (dailyData?.data || []).map(d => 
          d.day_name === dailyData?.highest_day ? '#DC2626' : d.day_name === 'Saturday' || d.day_name === 'Sunday' ? '#9333EA' : '#0B63E5'
        ),
        borderRadius: 6
      }
    ]
  };

  // 3. Monthly Seasonal Chart Data
  const monthlyChartData = {
    labels: (monthlyData?.data || []).map(d => d.month_name),
    datasets: [
      {
        label: 'Monthly Mean Demand (MW)',
        data: (monthlyData?.data || []).map(d => d.average_mw),
        borderColor: '#D97706',
        backgroundColor: 'rgba(217, 119, 6, 0.15)',
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#D97706',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', align: 'end' }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: '#F1F5F9' },
        ticks: { callback: (v) => `${(v/1000).toFixed(1)}k MW` }
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border-card)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(11, 99, 229, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Compass size={20} color="var(--eco-blue)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--eco-navy)' }}>
                  Historical Pattern Discovery
                </h3>
                <span className="badge badge-blue">FEATURE 5</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Discovered recurring operational baselines & normal tolerance corridors for {region} Grid
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {/* Tab Controls */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-card)',
          padding: '0 24px',
          background: '#FFFFFF',
          gap: '8px'
        }}>
          {[
            { id: 'HOURLY', label: '🌅 Diurnal 24-Hour Cycle', icon: Clock },
            { id: 'DAILY', label: '📅 Day-of-Week & Weekend Split', icon: Calendar },
            { id: 'MONTHLY', label: '🍁 12-Month Seasonal Macro Cycle', icon: Sun }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '14px 16px',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  color: isActive ? 'var(--eco-blue)' : 'var(--text-muted)',
                  borderBottom: isActive ? '3px solid var(--eco-blue)' : '3px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <div>Discovering multi-year historical patterns...</div>
            </div>
          ) : (
            <div>
              {/* Tab 1: Diurnal 24-Hour Baseline */}
              {activeTab === 'HOURLY' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ padding: '14px', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FCA5A5' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626', marginBottom: '2px' }}>
                        🔴 PEAK OPERATIONAL HOUR
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--eco-navy)' }} className="font-mono">
                        {hourlyData?.peak_hour}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Avg Demand: {hourlyData?.peak_average_mw?.toLocaleString()} MW
                      </div>
                    </div>

                    <div style={{ padding: '14px', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #86EFAC' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16A34A', marginBottom: '2px' }}>
                        🟢 LOWEST BASELOAD HOUR
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--eco-navy)' }} className="font-mono">
                        {hourlyData?.lowest_hour}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Avg Demand: {hourlyData?.lowest_average_mw?.toLocaleString()} MW
                      </div>
                    </div>

                    <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--eco-blue)', marginBottom: '2px' }}>
                        ⚡ DIURNAL SWING SPREAD
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--eco-navy)' }} className="font-mono">
                        +{hourlyData?.diurnal_swing_pct}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        +{hourlyData?.diurnal_swing_mw?.toLocaleString()} MW peak surge
                      </div>
                    </div>
                  </div>

                  <div style={{ height: '300px', marginBottom: '18px' }}>
                    <Line data={hourlyChartData} options={chartOptions} />
                  </div>

                  <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid var(--border-card)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    💡 <strong>Normal Baseline Corridor:</strong> Shaded region represents $\pm 1\sigma$ standard variation band. Real-time readings falling outside this blue band represent true statistically significant anomalies.
                  </div>
                </div>
              )}

              {/* Tab 2: Day of Week & Weekend Split */}
              {activeTab === 'DAILY' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ padding: '14px', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FCA5A5' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626', marginBottom: '2px' }}>
                        🔴 HIGHEST OPERATING DAY
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--eco-navy)' }}>
                        {dailyData?.highest_day}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {dailyData?.highest_average_mw?.toLocaleString()} MW mean
                      </div>
                    </div>

                    <div style={{ padding: '14px', background: '#F5F3FF', borderRadius: '10px', border: '1px solid #DDD6FE' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C3AED', marginBottom: '2px' }}>
                        🟣 WEEKEND DROP SETBACK
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7C3AED' }} className="font-mono">
                        -{weekendData?.weekend_setback_pct}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Industrial/commercial setback
                      </div>
                    </div>

                    <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--eco-blue)', marginBottom: '2px' }}>
                        📊 WEEKDAY VS WEEKEND
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--eco-navy)' }}>
                        Wkday: {weekendData?.weekday_average_mw?.toLocaleString()} MW
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        Wkend: {weekendData?.weekend_average_mw?.toLocaleString()} MW
                      </div>
                    </div>
                  </div>

                  <div style={{ height: '300px', marginBottom: '18px' }}>
                    <Bar data={dailyChartData} options={chartOptions} />
                  </div>
                </div>
              )}

              {/* Tab 3: Monthly Seasonal Macro Cycle */}
              {activeTab === 'MONTHLY' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ padding: '14px', background: '#FEF3C7', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', marginBottom: '2px' }}>
                        ☀️ ANNUAL PEAK MONTH
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--eco-navy)' }}>
                        {monthlyData?.highest_month}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Summer Cooling Peak: {monthlyData?.highest_average_mw?.toLocaleString()} MW
                      </div>
                    </div>

                    <div style={{ padding: '14px', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #86EFAC' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16A34A', marginBottom: '2px' }}>
                        🌱 ANNUAL MINIMUM TROUGH
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--eco-navy)' }}>
                        {monthlyData?.lowest_month}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Mild Weather Base: {monthlyData?.lowest_average_mw?.toLocaleString()} MW
                      </div>
                    </div>

                    <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--eco-blue)', marginBottom: '2px' }}>
                        🌡️ SEASONAL RANGE
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--eco-navy)' }} className="font-mono">
                        +{monthlyData?.seasonal_swing_pct}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Macro weather swing
                      </div>
                    </div>
                  </div>

                  <div style={{ height: '300px', marginBottom: '18px' }}>
                    <Line data={monthlyChartData} options={chartOptions} />
                  </div>
                </div>
              )}

              {/* Synthesized Key Takeaways */}
              <div style={{ marginTop: '20px', padding: '16px', background: '#F1F5F9', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--eco-navy)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="var(--eco-blue)" />
                  <span>Synthesized Ground-Truth Insights for {region}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {(patternSummary?.insights || []).map((ins, idx) => (
                    <div key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-main)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <CheckCircle2 size={14} color="var(--eco-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{ins}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-card)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: '#F8FAFC',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px'
        }}>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close Pattern Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
