import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { energyApi } from '../services/api';
import KPICard from '../components/common/KPICard';
import ChartCard from '../components/common/ChartCard';
import { 
  Zap, 
  Activity, 
  AlertTriangle, 
  DollarSign, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
  FileText
} from 'lucide-react';
import EnergyHealthModal from '../components/common/EnergyHealthModal';
import EnergyReportModal from '../components/common/EnergyReportModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardOverview({ onNavigate }) {
  const { selectedRegion, tariffRate } = useAuth();

  const [forecastData, setForecastData] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [costData, setCostData] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [timeframe, setTimeframe] = useState('24H');
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [fc, hs, anos, cost, series, recs] = await Promise.all([
          energyApi.getNextHourForecast(selectedRegion).catch(() => null),
          energyApi.getHealthScore(selectedRegion).catch(() => null),
          energyApi.getAnomalies(selectedRegion).catch(() => []),
          energyApi.getCostImpact(selectedRegion, tariffRate).catch(() => null),
          energyApi.getHourlyLoad(selectedRegion, timeframe === '7D' ? 168 : timeframe === '48H' ? 48 : 24).catch(() => []),
          energyApi.getRecommendations(selectedRegion).catch(() => [])
        ]);

        const anoList = Array.isArray(anos) ? anos : (anos?.anomalies || []);

        setForecastData(fc);
        setHealthScore(hs);
        setAnomalies(anoList);
        setCostData(cost);
        setTimeSeries(series || []);
        setRecommendations(recs || []);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [selectedRegion, tariffRate, timeframe]);

  // Chart configuration for Actual vs Predicted
  const chartData = {
    labels: timeSeries.map(s => s.label),
    datasets: [
      {
        label: 'Actual Energy (MW)',
        data: timeSeries.map(s => s.actualMW),
        borderColor: '#0B63E5', // Eco Blue
        backgroundColor: 'rgba(11, 99, 229, 0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#0B63E5'
      },
      {
        label: 'AI Forecast (MW)',
        data: timeSeries.map(s => s.predictedMW),
        borderColor: '#D97706', // Eco Amber
        borderDash: [5, 5],
        borderWidth: 2,
        fill: false,
        tension: 0.35,
        pointRadius: (ctx) => {
          const index = ctx.dataIndex;
          return timeSeries[index]?.isForecastOnly ? 7 : 0;
        },
        pointBackgroundColor: '#D97706',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 12,
          font: { family: 'Inter', size: 12, weight: '600' },
          color: '#475569'
        }
      },
      tooltip: {
        backgroundColor: '#0A2540',
        titleFont: { family: 'Inter', size: 13, weight: '700' },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y?.toLocaleString() || 'N/A'} MW`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#64748B' }
      },
      y: {
        grid: { color: '#F1F5F9' },
        ticks: {
          font: { family: 'JetBrains Mono', size: 11 },
          color: '#64748B',
          callback: (val) => `${(val / 1000).toFixed(1)}k MW`
        }
      }
    }
  };

  return (
    <div className="page-body">
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        background: '#FFFFFF',
        padding: '18px 24px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-card)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--eco-navy)', margin: 0 }}>
              {selectedRegion} Facility Command Center
            </h1>
            <span className="badge badge-green">LIVE INGESTION</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Integrated Real-Time Load Forecasting, Context-Aware Anomaly Detection & Building Health Monitoring.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => onNavigate('forecasting')} 
            className="btn btn-outline"
          >
            <Clock size={15} />
            <span>1-Hr Sandbox</span>
          </button>

          <button 
            onClick={() => setShowReportModal(true)} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={15} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 4 Core Executive KPI Cards */}
      <div className="grid-kpi">
        <KPICard
          title="Current Grid Load"
          value={forecastData ? forecastData.currentLoadMW.toLocaleString() : '---'}
          unit="MW"
          subtitle="Real-time measured demand"
          icon={Activity}
          accentColor="var(--eco-blue)"
          badgeText="Active"
          badgeType="badge-blue"
        />

        <KPICard
          title="1-Hour Ahead Forecast"
          value={forecastData ? forecastData.predictedLoadMW.toLocaleString() : '---'}
          unit="MW"
          subtitle={`Target: ${forecastData?.forecastTimestamp || 'Next Hour'}`}
          trend={forecastData?.expectedDeltaPct}
          trendPositiveIsGood={false}
          icon={Clock}
          accentColor="var(--eco-amber)"
          badgeText={`R² ${forecastData?.modelAccuracyR2 || 0.997}`}
          badgeType="badge-amber"
        />

        <KPICard
          title="Energy Health Score"
          value={healthScore ? `${healthScore.overallScore}/100` : '---'}
          subtitle={`Grade: ${healthScore?.statusGrade || 'OPTIMAL'}`}
          icon={ShieldCheck}
          accentColor="var(--eco-green)"
          badgeText={healthScore?.statusGrade}
          badgeType="badge-green"
          onClick={() => onNavigate('anomalies')}
        />

        <KPICard
          title="Monthly Cost Impact"
          value={costData ? (costData.projectedMonthlyCostUSD ? (costData.projectedMonthlyCostUSD >= 1_000_000_000 ? `$${(costData.projectedMonthlyCostUSD / 1_000_000_000).toFixed(2)}` : `$${(costData.projectedMonthlyCostUSD / 1_000_000).toFixed(2)}`) : '---') : '---'}
          unit={costData?.projectedMonthlyCostUSD >= 1_000_000_000 ? 'B USD' : 'M USD'}
          subtitle={`At $${tariffRate.toFixed(2)} / kWh tariff`}
          icon={DollarSign}
          accentColor="var(--eco-purple)"
          badgeText="Configurable"
          badgeType="badge-purple"
          onClick={() => onNavigate('optimization')}
        />
      </div>

      {/* Main Grid: Forecast Time-Series Chart + Live Anomaly Feed */}
      <div className="grid-2-1">
        {/* Actual vs Forecast Dual Series Chart */}
        <ChartCard
          title="Adaptive Load Forecast vs Actual Consumption"
          subtitle="Real-time XGBoost 1-hour prediction overlay with historical test continuity"
          badge="Feature 1 & 3"
          timeframes={['24H', '48H', '7D']}
          activeTimeframe={timeframe}
          onTimeframeChange={setTimeframe}
          footerNote={`Model: XGBoost Regressor (16 Engineered Features) • Baseline: ${forecastData?.currentLoadMW?.toLocaleString()} MW`}
        >
          <Line data={chartData} options={chartOptions} />
        </ChartCard>

        {/* Live Anomaly Feed & Health Score Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Anomaly Alerts Box */}
          <div className="eco-card" style={{ flex: 1 }}>
            <div className="eco-card-header">
              <div>
                <h3 className="eco-card-title">
                  <AlertTriangle size={18} color="var(--eco-red)" />
                  <span>Active Anomaly Feed</span>
                </h3>
                <p className="eco-card-subtitle">Context-aware deviations from predicted baseline</p>
              </div>
              <span className="badge badge-red">{anomalies.length} Flagged</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {anomalies.slice(0, 3).map(ano => (
                <div 
                  key={ano.id}
                  style={{
                    backgroundColor: ano.severity === 'CRITICAL' ? '#FEF2F2' : '#FFFBEB',
                    border: `1px solid ${ano.severity === 'CRITICAL' ? '#FCA5A5' : '#FDE68A'}`,
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: ano.severity === 'CRITICAL' ? 'var(--eco-red)' : 'var(--eco-amber)' }}>
                      {ano.direction}
                    </span>
                    <span className={`badge ${ano.severity === 'CRITICAL' ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                      {ano.severity} • {ano.residualMW > 0 ? `+${ano.deviationPct}%` : `-${ano.deviationPct}%`}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    {ano.rootCause}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
                    <span>Actual: {ano.actualMW?.toLocaleString()} MW (Exp: {ano.expectedMW?.toLocaleString()})</span>
                    <span>{ano.date} {ano.time}</span>
                  </div>
                </div>
              ))}

              {anomalies.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No active anomalies detected in recent window.
                </div>
              )}
            </div>

            <button 
              onClick={() => onNavigate('anomalies')}
              className="btn btn-outline btn-sm" 
              style={{ width: '100%', marginTop: '14px', justifyContent: 'center' }}
            >
              <span>Explore Residual Diagnostics</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Actionable Insights + Health Scorecard */}
      <div className="grid-2">
        {/* Actionable Insights */}
        <div className="eco-card" style={{ borderLeft: '4px solid var(--eco-green)' }}>
          <div className="eco-card-header">
            <div>
              <h3 className="eco-card-title">
                <Sparkles size={18} color="var(--eco-green)" />
                <span>AI Actionable Recommendations</span>
              </h3>
              <p className="eco-card-subtitle">Automated peak shaving & cost reduction guidance</p>
            </div>
            <span className="badge badge-green">Feature 10</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recommendations.length > 0 ? (
              recommendations.slice(0, 3).map((rec) => (
                <div 
                  key={rec.id}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-canvas)',
                    borderLeft: `4px solid ${rec.priority === 'HIGH' ? 'var(--eco-red)' : 'var(--eco-green)'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--eco-navy)' }}>
                      {rec.title}
                    </span>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                      Save {rec.estimatedSavingsINR}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {rec.action}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--eco-navy)', marginBottom: '4px' }}>
                  ⚡ Peak Shaving Opportunity (17:00 – 20:00)
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Shift non-critical chiller and pump operations forward to 14:00 to reduce high-tariff surcharges by up to 12.5%.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Health Score Pillar Summary */}
        <div className="eco-card">
          <div className="eco-card-header">
            <div>
              <h3 className="eco-card-title">
                <ShieldCheck size={18} color="var(--eco-green)" />
                <span>Energy Health Scorecard</span>
              </h3>
              <p className="eco-card-subtitle">Multivariate score combining stability, peaks & predictability</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={() => setShowHealthModal(true)}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                Inspect Health
              </button>
              <span className="badge badge-green">{healthScore?.overallScore || 75}/100</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {healthScore?.subScores?.map((sub, idx) => (
              <div key={idx} style={{
                background: '#F8FAFC',
                border: '1px solid var(--border-card)',
                borderRadius: '8px',
                padding: '8px 12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--eco-navy)' }}>{sub.name}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--eco-navy)' }} className="font-mono">
                    {sub.score} / {sub.maxScore} pts
                  </span>
                </div>
                <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(sub.score / sub.maxScore) * 100}%`,
                    height: '100%',
                    backgroundColor: (sub.score / sub.maxScore) >= 0.8 ? 'var(--eco-green)' : (sub.score / sub.maxScore) >= 0.6 ? 'var(--eco-amber)' : 'var(--eco-red)'
                  }} />
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            {healthScore?.statusDescription}
          </p>
        </div>
      </div>

      {/* Feature 9: Energy Health Deep-Dive Modal */}
      <EnergyHealthModal 
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        region={selectedRegion}
      />

      {/* Feature 12: Automated Energy Intelligence Report Modal */}
      <EnergyReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        region={selectedRegion}
        tariff={tariffRate}
        initialReportType="executive"
      />
    </div>
  );
}
