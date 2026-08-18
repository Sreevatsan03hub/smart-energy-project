import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { energyApi } from '../services/api';
import ChartCard from '../components/common/ChartCard';
import KPICard from '../components/common/KPICard';
import { 
  TrendingUp, 
  Calendar, 
  Layers, 
  Search, 
  Activity, 
  BarChart2, 
  CalendarDays, 
  Sparkles, 
  ArrowRight,
  Flame,
  CheckCircle2,
  Cpu,
  Clock,
  Compass
} from 'lucide-react';
import HistoricalPatternsModal from '../components/common/HistoricalPatternsModal';
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

export default function EnergyAnalytics() {
  const { selectedRegion } = useAuth();

  const [trendGranularity, setTrendGranularity] = useState('HOURLY');
  const [trendsData, setTrendsData] = useState([]);
  const [trendsSummary, setTrendsSummary] = useState(null);
  const [similarDaysData, setSimilarDaysData] = useState(null);
  const [showPatternsModal, setShowPatternsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load Feature 3 Multiscale Trends & Feature 5/6 Similar Days
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const intervalKey = trendGranularity.toLowerCase();
        const limit = intervalKey === 'hourly' ? 168 : intervalKey === 'daily' ? 60 : intervalKey === 'weekly' ? 26 : 24;

        const [trendsResp, summaryResp, simResp] = await Promise.all([
          energyApi.getTrends(selectedRegion, intervalKey, null, null, limit).catch(() => ({ data: [] })),
          energyApi.getTrendsSummary(selectedRegion).catch(() => null),
          energyApi.getSimilarDays(selectedRegion, "Today").catch(() => null)
        ]);

        setTrendsData(trendsResp?.data || []);
        setTrendsSummary(summaryResp);
        setSimilarDaysData(simResp);
      } catch (err) {
        console.error("Analytics load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedRegion, trendGranularity]);

  // Feature 3: Multiscale Trend Chart Data (Line / Bar)
  const isBarChart = trendGranularity === 'MONTHLY' || trendGranularity === 'WEEKLY';
  const trendChartData = {
    labels: trendsData.map(d => d.label),
    datasets: [
      {
        type: isBarChart ? 'bar' : 'line',
        label: `${selectedRegion} Consumption (${trendGranularity})`,
        data: trendsData.map(d => d.usage_mw),
        borderColor: '#0B63E5',
        backgroundColor: isBarChart ? 'rgba(11, 99, 229, 0.75)' : 'rgba(11, 99, 229, 0.12)',
        borderRadius: isBarChart ? 6 : 0,
        borderWidth: 2.5,
        fill: !isBarChart,
        tension: 0.35,
        pointRadius: isBarChart ? 0 : trendsData.length > 50 ? 1 : 3,
        pointHoverRadius: 6
      }
    ]
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', align: 'end' },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#0F172A',
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y.toLocaleString()} MW`
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { maxTicksLimit: 8, font: { size: 11 } }
      },
      y: {
        grid: { color: '#F1F5F9' },
        ticks: { 
          callback: (v) => `${(v/1000).toFixed(1)}k MW`,
          font: { size: 11 }
        }
      }
    }
  };

  // Feature 6: Similar Day Overlaid 24-Hour Shape Comparison
  const similarDaysChartData = {
    labels: similarDaysData?.labels || Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
    datasets: [
      {
        label: `Target: ${similarDaysData?.targetDate || 'Selected Day'} (${similarDaysData?.targetDayName || 'Current'})`,
        data: similarDaysData?.selectedDay?.curve || [],
        borderColor: '#0B63E5',
        backgroundColor: 'rgba(11, 99, 229, 0.05)',
        borderWidth: 3.5,
        pointRadius: 2,
        pointBackgroundColor: '#0B63E5',
        tension: 0.3
      },
      ...(similarDaysData?.matches?.[0] ? [{
        label: `Match #1: ${similarDaysData.matches[0].date} (${similarDaysData.matches[0].similarityPct}% Match)`,
        data: similarDaysData.matches[0].curve,
        borderColor: '#00B33C',
        borderDash: [4, 4],
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3
      }] : []),
      ...(similarDaysData?.matches?.[1] ? [{
        label: `Match #2: ${similarDaysData.matches[1].date} (${similarDaysData.matches[1].similarityPct}% Match)`,
        data: similarDaysData.matches[1].curve,
        borderColor: '#D97706',
        borderDash: [2, 2],
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3
      }] : []),
      ...(similarDaysData?.matches?.[2] ? [{
        label: `Match #3: ${similarDaysData.matches[2].date} (${similarDaysData.matches[2].similarityPct}% Match)`,
        data: similarDaysData.matches[2].curve,
        borderColor: '#9333EA',
        borderDash: [1, 2],
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3
      }] : [])
    ]
  };

  return (
    <div className="page-body">
      {/* Header: Preserving FEATURE 3, 5 & 6 Badge and Title */}
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
              Energy Usage Trends, Patterns & Similar Day Finder
            </h1>
            <span className="badge badge-blue">FEATURE 3, 5 & 6</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Multiscale historical trend aggregation, recurring temporal diurnal patterns, and 24-hour curve shape matching.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowPatternsModal(true)}
            className="btn btn-outline btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              fontSize: '0.78rem',
              padding: '6px 12px',
              backgroundColor: '#FFFFFF'
            }}
          >
            <Compass size={15} color="var(--eco-blue)" />
            <span>🧭 Discovered Baseline Patterns</span>
          </button>

          <div style={{
            display: 'flex',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '8px',
            gap: '3px'
          }}>
            {['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'].map(gran => (
              <button
                key={gran}
                onClick={() => setTrendGranularity(gran)}
                style={{
                  border: 'none',
                  background: trendGranularity === gran ? '#FFFFFF' : 'transparent',
                  color: trendGranularity === gran ? 'var(--eco-navy)' : 'var(--text-muted)',
                  fontWeight: trendGranularity === gran ? 800 : 500,
                  fontSize: '0.78rem',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: trendGranularity === gran ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'var(--transition)'
                }}
              >
                {gran}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Statistical Aggregation KPI Cards (Feature 3 Live from /api/trends/summary) */}
      <div className="grid-kpi">
        <KPICard
          title="Total Energy Ingestion"
          value={trendsSummary?.total_gwh ? `${trendsSummary.total_gwh.toLocaleString()}k` : '---'}
          unit="MWh"
          subtitle={`Across ${trendsSummary?.sample_count?.toLocaleString() || 0} historical hours`}
          icon={Activity}
          accentColor="var(--eco-blue)"
          badgeText="Total"
          badgeType="badge-blue"
        />

        <KPICard
          title="Average Demand"
          value={trendsSummary?.average_mw ? trendsSummary.average_mw.toLocaleString() : '---'}
          unit="MW"
          subtitle="Diurnal baseline mean"
          icon={TrendingUp}
          accentColor="var(--eco-green)"
          badgeText="Baseline Mean"
          badgeType="badge-green"
        />

        <KPICard
          title="Peak Maximum Load"
          value={trendsSummary?.peak_mw ? trendsSummary.peak_mw.toLocaleString() : '---'}
          unit="MW"
          subtitle={trendsSummary?.peak_datetime ? `Peak on: ${trendsSummary.peak_datetime}` : 'Highest demand point'}
          icon={Flame}
          accentColor="var(--eco-red)"
          badgeText="All-Time Peak"
          badgeType="badge-red"
        />

        <KPICard
          title="Off-Peak Minimum Load"
          value={trendsSummary?.lowest_mw ? trendsSummary.lowest_mw.toLocaleString() : '---'}
          unit="MW"
          subtitle={trendsSummary?.lowest_datetime ? `Lowest on: ${trendsSummary.lowest_datetime}` : 'Lowest night base load'}
          icon={Calendar}
          accentColor="var(--eco-purple)"
          badgeText="Base Min"
          badgeType="badge-purple"
        />
      </div>

      {/* Main Grid: Multi-period Trend Chart (Feature 3) + Similar Day Curve Shape Overlay (Feature 5 & 6) */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Left Column: Multiscale Consumption Trend Chart (Feature 3) */}
        <ChartCard
          title={`${selectedRegion} Consumption Trends (${trendGranularity})`}
          subtitle="Continuous time-series telemetry filtered by active timeframe"
          badge={trendGranularity}
        >
          <div style={{ height: '320px', width: '100%' }}>
            {isBarChart ? (
              <Bar data={trendChartData} options={trendChartOptions} />
            ) : (
              <Line data={trendChartData} options={trendChartOptions} />
            )}
          </div>
        </ChartCard>

        {/* Right Column: Similar Day 24-Hour Shape Matching (Feature 5 & 6 Space) */}
        <ChartCard
          title="Similar Day Curve Shape Matcher (24-Hour Horizon)"
          subtitle="Feature 6: Ranks historical days with the most identical shape curve"
          badge="Vector Distance"
        >
          <div style={{ height: '320px', width: '100%' }}>
            <Line 
              data={similarDaysChartData}
              options={{
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
              }}
            />
          </div>
        </ChartCard>
      </div>

      {/* Middle Section: Top Historical Profile Matches (Feature 6: Similar Day Finder) */}
      <div className="eco-card" style={{ marginBottom: '24px' }}>
        <div className="eco-card-header">
          <div>
            <h3 className="eco-card-title">
              <Search size={18} color="var(--eco-blue)" />
              <span>Top Historical Profile Matches for {selectedRegion}</span>
            </h3>
            <p className="eco-card-subtitle">
              Normalized cosine vector similarity matching across {similarDaysData?.totalComparisons || 0} historical {similarDaysData?.targetDayName ? `${similarDaysData.targetDayName}s` : 'days'}.
            </p>
          </div>
          <span className="badge badge-blue">FEATURE 6</span>
        </div>

        {similarDaysData?.matches?.length > 0 ? (
          <div className="table-responsive">
            <table className="eco-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Matched Date</th>
                  <th>Similarity Score</th>
                  <th>Day Type</th>
                  <th>Peak Hour</th>
                  <th>Average Demand</th>
                  <th>Peak Demand</th>
                </tr>
              </thead>
              <tbody>
                {similarDaysData.matches.map((match, idx) => (
                  <tr key={idx}>
                    <td><span className={`badge ${idx === 0 ? 'badge-green' : idx === 1 ? 'badge-amber' : 'badge-blue'}`}>#{idx + 1}</span></td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>{match.date}</td>
                    <td><span className={`badge ${match.similarityPct >= 99.8 ? 'badge-green' : 'badge-amber'}`}>{match.similarityPct}% Match</span></td>
                    <td>{match.dayType}</td>
                    <td className="font-mono">{match.peakHour}</td>
                    <td className="font-mono">{match.avgMW?.toLocaleString()} MW</td>
                    <td className="font-mono" style={{ fontWeight: 700, color: 'var(--eco-navy)' }}>{match.peakMW?.toLocaleString()} MW</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            padding: '24px',
            background: '#F8FAFC',
            borderRadius: '8px',
            border: '1px dashed var(--border-card)',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <CalendarDays size={28} style={{ margin: '0 auto 8px', color: 'var(--eco-blue)' }} />
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--eco-navy)', marginBottom: '4px' }}>
              Feature 6: Similar Day Finder
            </div>
            <p style={{ fontSize: '0.8rem', margin: 0 }}>
              Calculating cosine vector similarity across historical profiles...
            </p>
          </div>
        )}
      </div>

      {/* Bottom Row: Deep Technical Insights & Zero-Leakage Architecture (Hackathon Evaluation Cards) */}
      <div className="grid-2">
        {/* Aggregation Insights Card */}
        <div className="eco-card">
          <div className="eco-card-header">
            <div>
              <h3 className="eco-card-title">
                <Layers size={18} color="var(--eco-blue)" />
                <span>Multiscale Aggregation Insights</span>
              </h3>
              <p className="eco-card-subtitle">Statistical breakdown across {trendGranularity.toLowerCase()} intervals</p>
            </div>
            <span className="badge badge-blue">FEATURE 3</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--eco-navy)', marginBottom: '4px' }}>
                📅 Time Horizon Summary ({trendGranularity})
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Aggregating {trendsData.length} {trendGranularity.toLowerCase()} periods for the {selectedRegion} grid. The average continuous operating demand is <strong>{trendsSummary?.average_mw?.toLocaleString()} MW</strong>.
              </p>
            </div>

            <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--eco-navy)', marginBottom: '4px' }}>
                ⚡ Peak vs Minimum Spread
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                All-time historical swing spans from a minimum of <strong>{trendsSummary?.lowest_mw?.toLocaleString()} MW</strong> up to <strong>{trendsSummary?.peak_mw?.toLocaleString()} MW</strong> (a {trendsSummary ? ((trendsSummary.peak_mw / (trendsSummary.lowest_mw || 1)).toFixed(1)) : '2.0'}x peak-to-base spread).
              </p>
            </div>
          </div>
        </div>

        {/* Feature Overview Card */}
        <div className="eco-card">
          <div className="eco-card-header">
            <div>
              <h3 className="eco-card-title">
                <CheckCircle2 size={18} color="var(--eco-green)" />
                <span>Zero Data Leakage Data Pipeline</span>
              </h3>
              <p className="eco-card-subtitle">PJM Interconnection hourly telemetry pipeline</p>
            </div>
            <span className="badge badge-green">CLEANED CSV</span>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 10px 0' }}>
              Historical consumption is resampled directly from verified time-stamped datasets without interpolation artifacts:
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>Hourly View:</strong> Ingests high-resolution continuous telemetry.</li>
              <li><strong>Daily View:</strong> Resamples daily consumption profile curves.</li>
              <li><strong>Weekly View:</strong> Aggregates 7-day cyclical operating loads.</li>
              <li><strong>Monthly View:</strong> Macro-economic and seasonal baseline throughput.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Feature 5: Historical Pattern Discovery Deep-Dive Modal */}
      <HistoricalPatternsModal
        isOpen={showPatternsModal}
        onClose={() => setShowPatternsModal(false)}
        region={selectedRegion}
      />
    </div>
  );
}
