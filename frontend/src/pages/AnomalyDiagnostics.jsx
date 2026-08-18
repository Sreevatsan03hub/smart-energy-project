import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { energyApi } from '../services/api';
import ChartCard from '../components/common/ChartCard';
import KPICard from '../components/common/KPICard';
import ExplainabilityModal from '../components/common/ExplainabilityModal';
import { 
  AlertTriangle, 
  Activity, 
  Clock, 
  TrendingDown, 
  HelpCircle, 
  CheckCircle2, 
  Flame, 
  Moon, 
  ArrowRight, 
  Filter,
  Zap,
  Radio,
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
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AnomalyDiagnostics() {
  const { selectedRegion } = useAuth();
  const { triggerToast } = useAlert();

  const [anomalies, setAnomalies] = useState([]);
  const [anomalySummary, setAnomalySummary] = useState(null);
  const [peakAnalytics, setPeakAnalytics] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [residualHorizon, setResidualHorizon] = useState(24);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [anosResp, peaks, series] = await Promise.all([
          energyApi.getAnomalies(selectedRegion),
          energyApi.getPeakAnalytics(selectedRegion),
          energyApi.getHourlyLoad(selectedRegion, residualHorizon)
        ]);

        const anoList = Array.isArray(anosResp) ? anosResp : (anosResp?.anomalies || []);
        setAnomalies(anoList);
        setAnomalySummary(anosResp);
        setPeakAnalytics(peaks);
        setTimeSeries(series || []);
        if (anoList.length > 0) {
          setSelectedAnomaly(anoList[0]);
        }
      } catch (err) {
        console.error("Anomaly data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedRegion, residualHorizon]);

  // Live Anomaly Simulation Trigger (Option A: Pure Backend Fetch)
  const handleSimulateLiveAnomaly = async (type = 'SPIKE') => {
    setIsSimulating(true);
    try {
      const devFactor = type === 'SPIKE' ? 0.14 : -0.12;
      const res = await energyApi.simulateAnomaly(selectedRegion, Math.abs(devFactor), type);

      // Trigger Audio Chime + Slide-In Toast Notification
      triggerToast({
        id: `sim_${Date.now()}`,
        title: `🚨 ${res.severity} ANOMALY: ${res.direction}`,
        region: selectedRegion,
        timestamp: `${res.timestamp} (Live Stream)`,
        severity: res.severity,
        deviationPct: res.deviationPct,
        actualMW: res.actualMW,
        expectedMW: res.expectedMW,
        rootCause: res.rootCause
      });

      // Inject into Anomaly Table Live
      const newEvent = {
        id: `sim_${Date.now()}`,
        date: 'Aug 03, 2018',
        time: '01:00 (Live)',
        timestamp: `${selectedRegion}, Aug 03 01:00`,
        direction: res.direction,
        actualMW: res.actualMW,
        expectedMW: res.expectedMW,
        residualMW: res.residualMW,
        deviationPct: res.deviationPct,
        severity: res.severity,
        confidenceScore: res.confidenceScore,
        durationHours: 1,
        rootCause: res.rootCause
      };

      setAnomalies(prev => [newEvent, ...prev]);
      setSelectedAnomaly(newEvent);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Calculate dynamic 2.5 sigma threshold in MW
  const residuals = timeSeries.map(s => Math.abs(s.residualMW || 0));
  const meanRes = residuals.length ? residuals.reduce((a, b) => a + b, 0) / residuals.length : 150;
  const stdRes = residuals.length ? Math.sqrt(residuals.map(x => Math.pow(x - meanRes, 2)).reduce((a, b) => a + b, 0) / residuals.length) : 80;
  const thresholdMW = Math.round(meanRes + (2.5 * stdRes));

  // Residual Error Deviation Chart (|Actual - Forecast|)
  const residualChartData = {
    labels: timeSeries.map(s => s.label),
    datasets: [
      {
        label: 'Residual Deviation (|Actual - Forecast| MW)',
        data: timeSeries.map(s => Math.abs(s.residualMW || 0)),
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.12)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: (ctx) => (Math.abs(timeSeries[ctx.dataIndex]?.residualMW || 0) > thresholdMW ? 6 : 2),
        pointBackgroundColor: '#DC2626'
      },
      {
        label: `Anomaly Threshold (${thresholdMW} MW)`,
        data: timeSeries.map(() => thresholdMW),
        borderColor: '#D97706',
        borderDash: [5, 5],
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0
      }
    ]
  };

  // Diurnal Peak vs Off-Peak Profile (Feature 4)
  const profileList = peakAnalytics?.profile || [];
  const diurnalChartData = {
    labels: profileList.map(p => p.label),
    datasets: [
      {
        label: 'Average Load (MW)',
        data: profileList.map(p => p.avgLoadMW),
        backgroundColor: profileList.map(p => 
          p.zone === 'PEAK' ? '#DC2626' : p.zone === 'OFF_PEAK' ? '#00B33C' : '#0B63E5'
        ),
        borderRadius: 4
      }
    ]
  };

  return (
    <div className="page-body">
      {/* Header with Live Anomaly Simulation Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        background: '#FFFFFF',
        padding: '18px 24px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-card)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--eco-navy)', margin: 0 }}>
              Context-Aware Anomaly Diagnostics & Peak Analysis
            </h1>
            <span className="badge badge-red">FEATURE 2 & 4</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Evaluates prediction residuals (|Actual - Forecast|) against context-aware statistical thresholds to flag abnormal load behavior.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Live Anomaly Injection Buttons */}
          <button
            onClick={() => handleSimulateLiveAnomaly('SPIKE')}
            disabled={isSimulating}
            className="btn btn-sm"
            style={{
              background: '#FEE2E2',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Zap size={14} />
            <span>⚡ Simulate Grid Spike</span>
          </button>

          <button
            onClick={() => handleSimulateLiveAnomaly('DROP')}
            disabled={isSimulating}
            className="btn btn-sm"
            style={{
              background: '#FEF3C7',
              color: '#D97706',
              border: '1px solid #FDE68A',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Radio size={14} />
            <span>🔻 Simulate Substation Drop</span>
          </button>

          <span className="badge badge-red" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            <Flame size={14} />
            <span>Peak Window: {peakAnalytics?.peakWindow || '17:00 – 20:00'}</span>
          </span>
        </div>
      </div>

      {/* 4 KPIs */}
      <div className="grid-kpi">
        <KPICard
          title="Total Flagged Anomalies"
          value={anomalySummary?.totalAnomalies || anomalies.length}
          subtitle={`Critical: ${anomalySummary?.criticalCount || 0} events`}
          icon={AlertTriangle}
          accentColor="var(--eco-red)"
          badgeText="95th% Threshold"
          badgeType="badge-red"
        />

        <KPICard
          title="Avg Peak Demand"
          value={peakAnalytics?.peakAvgMW ? peakAnalytics.peakAvgMW.toLocaleString() : '---'}
          unit="MW"
          subtitle={peakAnalytics?.peakWindow || '17:00 – 20:00'}
          icon={Flame}
          accentColor="var(--eco-amber)"
          badgeText="Peak Surcharge"
          badgeType="badge-amber"
        />

        <KPICard
          title="Avg Off-Peak Demand"
          value={peakAnalytics?.offPeakAvgMW ? peakAnalytics.offPeakAvgMW.toLocaleString() : '---'}
          unit="MW"
          subtitle={peakAnalytics?.offPeakWindow || '01:00 – 05:00'}
          icon={Moon}
          accentColor="var(--eco-green)"
          badgeText="Base Tariff"
          badgeType="badge-green"
        />

        <KPICard
          title="Peak-to-Average Ratio"
          value={peakAnalytics?.peakToAvgRatio ? `${peakAnalytics.peakToAvgRatio}x` : '1.12x'}
          subtitle="Diurnal grid load concentration"
          icon={Activity}
          accentColor="var(--eco-blue)"
          badgeText="Diurnal Factor"
          badgeType="badge-blue"
        />
      </div>

      {/* Main Grid: Residual Timeline + Diurnal Heatmap */}
      {(() => {
        const validSeries = timeSeries.filter(s => !s.isForecastOnly);
        const resDateRangeStr = validSeries.length >= 2 
          ? `${validSeries[0].fullTime} → ${validSeries[validSeries.length - 1].fullTime}` 
          : '';

        return (
          <div className="grid-2">
            {/* Residual Deviation Explorer */}
            <ChartCard
              title="Residual Deviation Timeline (|Actual - Expected|)"
              subtitle={`Time Window: ${resDateRangeStr} (${residualHorizon === 168 ? '7 Days' : residualHorizon === 48 ? '48 Hours' : '24 Hours'}). Residuals crossing threshold line represent statistically abnormal events.`}
              badge={`${residualHorizon === 168 ? '7 Days' : residualHorizon === 48 ? '48 Hours' : '24 Hours'} Horizon`}
              timeframes={['24 Hours', '48 Hours', '7 Days']}
              activeTimeframe={residualHorizon === 168 ? '7 Days' : residualHorizon === 48 ? '48 Hours' : '24 Hours'}
              onTimeframeChange={(tf) => setResidualHorizon(tf === '7 Days' ? 168 : tf === '48 Hours' ? 48 : 24)}
            >
              <div style={{ height: '300px' }}>
                <Line 
                  data={residualChartData}
                  options={{
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
                        labels: { boxWidth: 12, font: { size: 11 } }
                      },
                      tooltip: {
                        backgroundColor: '#0A2540',
                        titleFont: { family: 'Inter', size: 12, weight: '700' },
                        bodyFont: { family: 'JetBrains Mono', size: 11 },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                          title: (items) => {
                            const idx = items[0]?.dataIndex;
                            return timeSeries[idx]?.fullTime || items[0]?.label;
                          },
                          label: (ctx) => {
                            const idx = ctx.dataIndex;
                            const item = timeSeries[idx];
                            if (ctx.datasetIndex === 0) {
                              return [
                                ` 🔴 Residual Error: ${ctx.parsed.y?.toLocaleString()} MW`,
                                ` 🔵 Actual Load: ${item?.actualMW?.toLocaleString()} MW`,
                                ` 🟠 AI Expected: ${item?.predictedMW?.toLocaleString()} MW`,
                                ` ⚡ Deviation: ${item?.residualMW > 0 ? '+' : ''}${item?.deviationPct}%`
                              ];
                            }
                            return ` 🟠 ${ctx.dataset.label}: ${ctx.parsed.y} MW`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: { grid: { display: false } },
                      y: {
                        grid: { color: '#F1F5F9' },
                        ticks: { callback: (v) => `${v} MW` }
                      }
                    }
                  }}
                />
              </div>
            </ChartCard>

            {/* Diurnal Peak vs Off-Peak Profile */}
            <ChartCard
              title="Diurnal Hourly Load Profile (Peak vs Off-Peak)"
              subtitle="Aggregated 24-Hour Profile across 2 Years (Aug 2016 – Aug 2018 • 17,403+ Readings). Red: Peak Tariff Window (17-20h) • Green: Off-Peak Base (01-05h) • Blue: Standard Daytime"
              badge="Feature 4"
            >
              <div style={{ height: '300px' }}>
                <Bar 
                  data={diurnalChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => ` Load: ${ctx.raw.toLocaleString()} MW`
                        }
                      }
                    },
                    scales: {
                      x: { grid: { display: false } },
                      y: {
                        grid: { color: '#F1F5F9' },
                        ticks: { callback: (v) => `${(v/1000).toFixed(1)}k MW` }
                      }
                    }
                  }}
                />
              </div>
            </ChartCard>
          </div>
        );
      })()}

      {/* Bottom Grid: Detailed Anomaly Table + Selected Anomaly Root Cause */}
      <div className="grid-2-1">
        {/* Anomaly Records Table */}
        <div className="eco-card">
          <div className="eco-card-header">
            <div>
              <h3 className="eco-card-title">
                <AlertTriangle size={18} color="var(--eco-red)" />
                <span>Historical Anomaly Incident Log ({selectedRegion})</span>
              </h3>
              <p className="eco-card-subtitle">Master record of 50 most severe anomalies detected across 2 years (Aug 2016 – Jul 2018). Click any row to view AI root-cause diagnostics.</p>
            </div>
            <span className="badge badge-red">{anomalies.length} Flagged</span>
          </div>

          <div className="table-responsive" style={{ maxHeight: '340px' }}>
            <table className="eco-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Classification</th>
                  <th>Actual</th>
                  <th>Expected</th>
                  <th>Deviation</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map(ano => (
                  <tr 
                    key={ano.id}
                    onClick={() => setSelectedAnomaly(ano)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedAnomaly?.id === ano.id ? 'var(--eco-green-light)' : 'transparent',
                      fontWeight: selectedAnomaly?.id === ano.id ? 700 : 400
                    }}
                  >
                    <td className="font-mono">{ano.date} {ano.time}</td>
                    <td>{ano.direction}</td>
                    <td className="font-mono">{ano.actualMW?.toLocaleString()} MW</td>
                    <td className="font-mono">{ano.expectedMW?.toLocaleString()} MW</td>
                    <td style={{ color: ano.deviationPct > 0 ? 'var(--eco-red)' : 'var(--eco-blue)', fontWeight: 700 }}>
                      {ano.residualMW > 0 ? `+${ano.deviationPct}%` : `-${ano.deviationPct}%`}
                    </td>
                    <td>
                      <span className={`badge ${ano.severity === 'CRITICAL' ? 'badge-red' : ano.severity === 'MEDIUM' ? 'badge-amber' : 'badge-blue'}`}>
                        {ano.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Explainability & Root Cause Card (Feature 7) */}
        <div className="eco-card" style={{ borderLeft: '4px solid var(--eco-red)' }}>
          <div className="eco-card-header">
            <div>
              <h3 className="eco-card-title">
                <HelpCircle size={18} color="var(--eco-navy)" />
                <span>AI Root-Cause Diagnostic</span>
              </h3>
              <p className="eco-card-subtitle">Feature 7: Why this deviation occurred</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={() => setShowExplainModal(true)}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Sparkles size={13} />
                <span>💡 Why this Anomaly?</span>
              </button>
              {selectedAnomaly && (
                <span className={`badge ${selectedAnomaly.severity === 'CRITICAL' ? 'badge-red' : 'badge-amber'}`}>
                  Confidence: {selectedAnomaly.confidenceScore}%
                </span>
              )}
            </div>
          </div>

          {selectedAnomaly ? (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SELECTED ANOMALY EVENT:</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--eco-navy)' }}>
                  {selectedAnomaly.direction}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                  {selectedAnomaly.date} at {selectedAnomaly.time} ({selectedAnomaly.durationHours} hr duration)
                </div>
              </div>

              <div style={{
                background: '#F8FAFC',
                border: '1px solid var(--border-card)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '14px'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--eco-navy)', marginBottom: '4px' }}>
                  FACILITY CONTEXT & DIAGNOSIS:
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4 }}>
                  {selectedAnomaly.rootCause}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px', fontSize: '0.8rem' }}>
                <div style={{ background: '#FEE2E2', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--eco-red)', fontWeight: 700 }}>Actual Measured</div>
                  <div className="font-mono" style={{ fontWeight: 800 }}>{selectedAnomaly.actualMW?.toLocaleString()} MW</div>
                </div>
                <div style={{ background: '#E6F8ED', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--eco-green-dark)', fontWeight: 700 }}>Model Expected</div>
                  <div className="font-mono" style={{ fontWeight: 800 }}>{selectedAnomaly.expectedMW?.toLocaleString()} MW</div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                🚨 Residual Deviation: <strong>{selectedAnomaly.residualMW > 0 ? `+${selectedAnomaly.residualMW}` : selectedAnomaly.residualMW} MW</strong> (exceeds {anomalySummary?.deviationThresholdPct || 2.5}% regional threshold).
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select an anomaly to inspect.</div>
          )}
        </div>
      </div>

      {/* Feature 7: AI Explainability Modal */}
      <ExplainabilityModal 
        isOpen={showExplainModal}
        onClose={() => setShowExplainModal(false)}
        defaultMode="ANOMALY"
        region={selectedRegion}
        anomalyId={selectedAnomaly?.id}
      />
    </div>
  );
}
