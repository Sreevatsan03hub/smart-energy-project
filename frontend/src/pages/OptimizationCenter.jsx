import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { energyApi } from '../services/api';
import ChartCard from '../components/common/ChartCard';
import KPICard from '../components/common/KPICard';
import EnergyReportModal from '../components/common/EnergyReportModal';
import { 
  Coins, 
  DollarSign, 
  Sparkles, 
  FileText, 
  Download, 
  CheckCircle2, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  PieChart as PieIcon,
  Printer,
  Sliders,
  Calendar,
  Layers,
  Activity,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function OptimizationCenter() {
  const { selectedRegion, tariffRate, setTariffRate } = useAuth();

  const [costData, setCostData] = useState(null);
  const [costTrends, setCostTrends] = useState([]);
  const [costInterval, setCostInterval] = useState('DAILY');
  const [recommendations, setRecommendations] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Load Cost Summary & Recommendations
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [c, recs, fc, h] = await Promise.all([
          energyApi.getCostImpact(selectedRegion, tariffRate),
          energyApi.getRecommendations(selectedRegion),
          energyApi.getNextHourForecast(selectedRegion).catch(() => null),
          energyApi.getHealthScore(selectedRegion).catch(() => null)
        ]);

        setCostData(c);
        setRecommendations(recs || []);
        setForecast(fc);
        setHealth(h);
      } catch (err) {
        console.error("Optimization load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedRegion, tariffRate]);

  // 2. Load Cost Trends (Multi-scale)
  useEffect(() => {
    async function loadTrends() {
      try {
        const intervalKey = costInterval.toLowerCase();
        const limit = intervalKey === 'hourly' ? 168 : intervalKey === 'daily' ? 30 : intervalKey === 'weekly' ? 12 : 12;
        const res = await energyApi.getCostTrends(selectedRegion, tariffRate, intervalKey, limit);
        setCostTrends(res?.data || []);
      } catch (err) {
        console.error("Cost trends load error:", err);
      }
    }

    loadTrends();
  }, [selectedRegion, tariffRate, costInterval]);

  // Helper function to format dollar amounts
  const formatUSD = (val) => {
    if (!val && val !== 0) return '---';
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
    return `$${val.toFixed(2)}`;
  };

  // Doughnut Cost Category Breakdown (Feature 8)
  const costDoughnutData = {
    labels: costData?.costTrendBreakdown?.map(c => c.category) || [],
    datasets: [
      {
        data: costData?.costTrendBreakdown?.map(c => c.costUSD) || [],
        backgroundColor: ['#0B63E5', '#00B33C', '#DC2626'],
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }
    ]
  };

  // Cost Trends Bar / Line Chart Data
  const isHourly = costInterval === 'HOURLY';
  const costTrendsChartData = {
    labels: costTrends.map(d => d.label),
    datasets: [
      {
        type: 'bar',
        label: isHourly ? 'Cost ($ Thousands)' : 'Cost ($ Millions)',
        data: costTrends.map(d => isHourly ? d.costThousands : d.costMillions),
        backgroundColor: 'rgba(11, 99, 229, 0.85)',
        borderRadius: 4,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Energy Consumed (MWh)',
        data: costTrends.map(d => d.mwh),
        borderColor: '#10B981',
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.3,
        yAxisID: 'y1'
      }
    ]
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`Automated Energy Executive Report for ${selectedRegion} generated successfully!`);
    }, 800);
  };

  return (
    <div className="page-body">
      {/* Header */}
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
              Energy Cost Impact, Tariffs & Optimization Center
            </h1>
            <span className="badge badge-purple">FEATURE 8, 10 & 12</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Converts physical MW telemetry into commercial billing currency ($/kWh), models multi-scale financial cost impact, and quantifies peak avoidance savings.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => setShowReportModal(true)}
            className="btn btn-navy"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={15} />
            <span>📄 Generate Executive Report</span>
          </button>
        </div>
      </div>

      {/* 4 Multi-Scale Financial KPIs (Feature 8 Core in USD) */}
      <div className="grid-kpi">
        <KPICard
          title="Today's Estimated Cost"
          value={costData ? formatUSD(costData.todayCostUSD) : '---'}
          unit="USD"
          subtitle={`Across ${costData?.todayMWh?.toLocaleString() || 0} MWh (24h)`}
          icon={DollarSign}
          accentColor="var(--eco-blue)"
          badgeText="Today (24h)"
          badgeType="badge-blue"
        />

        <KPICard
          title="This Week's Cost"
          value={costData ? formatUSD(costData.thisWeekCostUSD) : '---'}
          unit="USD"
          subtitle={`Past 7 calendar days (${costData?.thisWeekMWh?.toLocaleString() || 0} MWh)`}
          icon={Calendar}
          accentColor="var(--eco-purple)"
          badgeText="7-Day Rolling"
          badgeType="badge-purple"
        />

        <KPICard
          title="This Month's Actual Spend"
          value={costData ? formatUSD(costData.thisMonthCostUSD) : '---'}
          unit="USD"
          subtitle={`Past 30 days (${costData?.thisMonthMWh?.toLocaleString() || 0} MWh)`}
          icon={Coins}
          accentColor="var(--eco-navy)"
          badgeText="30-Day Actual"
          badgeType="badge-navy"
        />

        <KPICard
          title="Projected Monthly Budget"
          value={costData ? formatUSD(costData.projectedMonthlyCostUSD) : '---'}
          unit="USD"
          subtitle={`Run-rate based on $${tariffRate.toFixed(2)}/kWh`}
          icon={Sparkles}
          accentColor="var(--eco-green)"
          badgeText="Budget Run-Rate"
          badgeType="badge-green"
        />
      </div>

      {/* Main Grid: Multi-Scale Cost Trend Chart + Doughnut Expenditure Breakdown */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Cost Trends Time-Series Chart */}
        <ChartCard
          title={`${selectedRegion} Financial Cost Trends`}
          badge={`$${tariffRate.toFixed(2)}/kWh`}
          badgeType="badge-blue"
          subtitle="Multi-scale historical financial expenditure in US Dollars ($)"
          action={
            <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '6px', gap: '2px' }}>
              {['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'].map(interval => (
                <button
                  key={interval}
                  onClick={() => setCostInterval(interval)}
                  style={{
                    border: 'none',
                    background: costInterval === interval ? '#FFFFFF' : 'transparent',
                    color: costInterval === interval ? 'var(--eco-navy)' : 'var(--text-muted)',
                    fontWeight: costInterval === interval ? 700 : 500,
                    fontSize: '0.72rem',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {interval}
                </button>
              ))}
            </div>
          }
        >
          <div style={{ height: '280px', width: '100%' }}>
            <Bar 
              data={costTrendsChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top', align: 'end' },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => `${ctx.dataset.label}: ${ctx.datasetIndex === 0 ? `$${ctx.raw}${isHourly ? 'k' : 'M'}` : `${ctx.raw} MWh`}`
                    }
                  }
                },
                scales: {
                  x: { grid: { display: false } },
                  y: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: '#F1F5F9' },
                    ticks: { callback: (v) => `$${v}${isHourly ? 'k' : 'M'}` }
                  },
                  y1: {
                    type: 'linear',
                    position: 'right',
                    grid: { display: false },
                    ticks: { callback: (v) => `${(v/1000).toFixed(0)}k MWh` }
                  }
                }
              }}
            />
          </div>
        </ChartCard>

        {/* Cost Distribution Doughnut */}
        <div className="eco-card">
          <div className="eco-card-header">
            <div>
              <h3 className="eco-card-title">
                <PieIcon size={18} color="var(--eco-purple)" />
                <span>Monthly Expenditure Breakdown</span>
              </h3>
              <p className="eco-card-subtitle">Base Baseload vs Peak Demand Surcharges (${tariffRate.toFixed(2)}/kWh)</p>
            </div>
            <span className="badge badge-purple">COST SLICES</span>
          </div>

          <div style={{ height: '210px', position: 'relative', marginBottom: '14px' }}>
            <Doughnut 
              data={costDoughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } }
                },
                cutout: '70%'
              }}
            />
          </div>

          <div style={{
            padding: '12px',
            background: '#FEF2F2',
            borderRadius: '8px',
            border: '1px solid #FCA5A5',
            fontSize: '0.8rem',
            color: '#991B1B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
            <div>
              <strong>Peak Penalty Surcharge:</strong> Incurring {formatUSD(costData?.peakPenaltyDailyUSD)}/day avoidable surcharge during peak tariff hours.
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Recommendations List (Feature 10) */}
      <div className="eco-card" style={{ marginBottom: '24px' }}>
        <div className="eco-card-header">
          <div>
            <h3 className="eco-card-title">
              <Sparkles size={18} color="var(--eco-green)" />
              <span>Prioritized Energy-Saving Recommendations</span>
            </h3>
            <p className="eco-card-subtitle">Feature 10: Algorithmic inefficiency detectors converting telemetry into concrete engineering actions</p>
          </div>
          <span className="badge badge-green">{recommendations.length} Detected Opportunities</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          {recommendations.map(rec => (
            <div
              key={rec.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-card)',
                borderRadius: '12px',
                padding: '18px',
                borderLeft: `5px solid ${rec.priority === 'CRITICAL' ? 'var(--eco-red)' : rec.priority === 'HIGH' ? 'var(--eco-green)' : 'var(--eco-blue)'}`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`badge ${rec.priority === 'CRITICAL' ? 'badge-red' : rec.priority === 'HIGH' ? 'badge-green' : 'badge-blue'}`}>
                      {rec.priority}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{rec.category}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>{rec.id}</span>
                </div>

                {/* Title */}
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--eco-navy)', margin: '0 0 10px 0' }}>
                  {rec.title}
                </h4>

                {/* 1. Problem Identified */}
                <div style={{
                  padding: '8px 10px',
                  background: '#FEF2F2',
                  borderRadius: '6px',
                  border: '1px solid #FEE2E2',
                  fontSize: '0.78rem',
                  color: '#991B1B',
                  marginBottom: '8px',
                  lineHeight: 1.35
                }}>
                  <strong>🚨 Problem:</strong> {rec.problem}
                </div>

                {/* 2. Root Cause / Reason */}
                <div style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginBottom: '10px',
                  lineHeight: 1.35
                }}>
                  <strong>💡 Reason:</strong> {rec.reason}
                </div>

                {/* 3. Suggested Action */}
                <div style={{
                  padding: '8px 10px',
                  background: '#F0FDF4',
                  borderRadius: '6px',
                  border: '1px solid #DCFCE7',
                  fontSize: '0.78rem',
                  color: '#166534',
                  marginBottom: '14px',
                  lineHeight: 1.35
                }}>
                  <strong>🛠️ Action:</strong> {rec.suggestedAction}
                </div>
              </div>

              {/* 4 & 5. Expected Impact Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-card)',
                background: '#F8FAFC',
                margin: '0 -18px -18px -18px',
                padding: '12px 18px',
                borderBottomLeftRadius: '11px',
                borderBottomRightRadius: '11px',
                fontSize: '0.75rem'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600 }}>Estimated Savings</div>
                  <div style={{ fontWeight: 800, color: 'var(--eco-green)', fontSize: '0.85rem' }}>{rec.savingsFormatted}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600 }}>Peak Relief</div>
                  <div style={{ fontWeight: 700, color: 'var(--eco-navy)' }}>-{rec.peakReductionMW} MW</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600 }}>Payback</div>
                  <div style={{ fontWeight: 700, color: 'var(--eco-purple)' }}>{rec.paybackMonths} Mo</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature 12: Automated Energy Intelligence Report Modal */}
      <EnergyReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        region={selectedRegion}
        tariff={tariffRate}
        initialReportType="financial"
      />
    </div>
  );
}
