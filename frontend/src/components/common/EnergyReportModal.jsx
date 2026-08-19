import React, { useState, useEffect, useRef } from 'react';
import { energyApi } from '../../services/api';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  Calendar, 
  DollarSign, 
  Activity, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  Layers,
  CheckCircle2
} from 'lucide-react';

export default function EnergyReportModal({
  isOpen,
  onClose,
  region = 'PJME',
  tariff = 0.12,
  initialReportType = 'executive'
}) {
  const [reportType, setReportType] = useState(initialReportType);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Sync initialReportType prop if changed
  useEffect(() => {
    setReportType(initialReportType);
  }, [initialReportType]);

  // Fetch report data whenever region, tariff, reportType, or dates change
  useEffect(() => {
    if (!isOpen) return;

    async function loadReport() {
      setLoading(true);
      try {
        const res = await energyApi.generateReport(
          region,
          startDate || null,
          endDate || null,
          reportType,
          tariff
        );
        setReportData(res);
        if (!startDate && res?.metadata?.startDate) {
          setStartDate(res.metadata.startDate);
        }
        if (!endDate && res?.metadata?.endDate) {
          setEndDate(res.metadata.endDate);
        }
      } catch (err) {
        console.error("Report generation error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [isOpen, region, tariff, reportType, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const url = energyApi.getReportHtmlUrl(region, startDate, endDate, reportType, tariff);
      const response = await fetch(url);
      const htmlContent = await response.text();

      // Build filename
      const regionLabel = region || 'PJME';
      const typeLabel = reportType === 'financial' ? 'Financial' : 'Executive';
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `SmartEnergy_${regionLabel}_${typeLabel}_Report_${dateStr}.pdf`;

      // Inject html2pdf.js from CDN and auto-download script (no print dialog)
      const pdfHtml = htmlContent.replace(
        '</body>',
        `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
        <script>
          window.onload = function() {
            var opt = {
              margin: [10, 10, 10, 10],
              filename: '${filename}',
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, logging: false },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
              pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };
            html2pdf().set(opt).from(document.body).save().then(function() {
              setTimeout(function() { window.close(); }, 1000);
            });
          };
        <\/script></body>`
      );

      const pdfWindow = window.open('', '_blank', 'width=1,height=1,left=-1000,top=-1000');
      pdfWindow.document.open();
      pdfWindow.document.write(pdfHtml);
      pdfWindow.document.close();
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const meta = reportData?.metadata;

  if (!isOpen) return null;

  const summary = reportData?.energySummary;
  const fc = reportData?.forecastPerformance;
  const peak = reportData?.peakAnalytics;
  const anom = reportData?.anomalyDiagnostics;
  const fin = reportData?.financialExposure;
  const health = reportData?.healthScorecard;
  const recs = reportData?.recommendations?.items || [];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(10, 37, 64, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        width: '1000px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          background: 'var(--eco-navy)',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid var(--eco-green)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'var(--eco-green)',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  Automated Energy Intelligence Report
                </h2>
                <span className="badge badge-green">FEATURE 12</span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                Consolidated grid analytics for <strong>{meta?.regionName || region} ({region})</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={handlePrint}
              className="btn btn-outline"
              style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button 
              onClick={handleExportPDF}
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: isExporting ? 0.7 : 1 }}
              disabled={isExporting}
            >
              <Download size={14} />
              <span>{isExporting ? 'Preparing...' : 'Export PDF'}</span>
            </button>
            <button 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{
          padding: '12px 24px',
          background: '#F8FAFC',
          borderBottom: '1px solid var(--border-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Report Type Switcher */}
          <div style={{ display: 'flex', background: '#E2E8F0', padding: '3px', borderRadius: '6px', gap: '2px' }}>
            <button
              onClick={() => setReportType('executive')}
              style={{
                border: 'none',
                background: reportType === 'executive' ? '#FFFFFF' : 'transparent',
                color: reportType === 'executive' ? 'var(--eco-navy)' : 'var(--text-muted)',
                fontWeight: reportType === 'executive' ? 700 : 500,
                fontSize: '0.75rem',
                padding: '5px 12px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🏛️ Executive Management Overview
            </button>
            <button
              onClick={() => setReportType('financial')}
              style={{
                border: 'none',
                background: reportType === 'financial' ? '#FFFFFF' : 'transparent',
                color: reportType === 'financial' ? 'var(--eco-navy)' : 'var(--text-muted)',
                fontWeight: reportType === 'financial' ? 700 : 500,
                fontSize: '0.75rem',
                padding: '5px 12px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              💰 Commercial Cost & ROI Audit
            </button>
          </div>

          {/* Date Range Inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Period:</span>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-card)', fontSize: '0.8rem' }}
              />
              <span>to</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-card)', fontSize: '0.8rem' }}
              />
            </div>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-card)',
              padding: '4px 8px',
              borderRadius: '6px',
              fontWeight: 700,
              color: 'var(--eco-navy)'
            }}>
              Rate: ${tariff.toFixed(2)}/kWh
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Synthesizing multi-feature telemetry for {region} grid...
              </p>
            </div>
          ) : (
            <div>
              {/* Report Header Title */}
              <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-card)', paddingBottom: '14px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--eco-navy)', margin: '0 0 4px 0' }}>
                  {meta?.reportTitle}
                </h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Generated: <strong>{meta?.generatedAt}</strong></span>
                  <span>•</span>
                  <span>Scope: <strong>{meta?.daysAnalyzed} Days ({meta?.totalHoursAnalyzed} Hours)</strong></span>
                  <span>•</span>
                  <span>Status: <strong style={{ color: 'var(--eco-green)' }}>100% Dynamic Backend Telemetry</strong></span>
                </div>
              </div>

              {/* 4 Consolidated Executive KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Total Consumption
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--eco-navy)', margin: '4px 0 2px 0' }}>
                    {summary?.totalConsumptionGWh} GWh
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {summary?.totalConsumptionMWh?.toLocaleString()} MWh
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Peak Grid Demand
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--eco-blue)', margin: '4px 0 2px 0' }}>
                    {summary?.peakDemandMW?.toLocaleString()} MW
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    At {summary?.peakTimestamp}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Period Energy Spend
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--eco-navy)', margin: '4px 0 2px 0' }}>
                    {fin?.periodCostFormatted}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Daily Run: {fin?.dailyAverageFormatted}/day
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Energy Health Score
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--eco-green)', margin: '4px 0 2px 0' }}>
                    {health?.overallScore}/100
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--eco-green)', fontWeight: 700 }}>
                    {health?.statusGrade} — {health?.statusLabel}
                  </div>
                </div>
              </div>

              {/* Section 1: Empirical Peak & Diurnal Operating Analysis */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--eco-navy)', margin: '0 0 6px 0', borderLeft: '4px solid var(--eco-blue)', paddingLeft: '8px' }}>
                  1. Empirical Peak & Diurnal Operating Analysis
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                  Telemetry demonstrates an empirical <strong>Peak-to-Average Ratio (PAR) of {peak?.peakToAverageRatio?.toFixed(2)}x</strong>. Peak demand windows concentrate during <strong>{peak?.peakHoursDetected?.map(h => `${String(h).padStart(2, '0')}:00`).join(', ')}</strong> with an average load of <strong>{peak?.averagePeakDemandMW?.toLocaleString()} MW</strong>. Baseload steps down to <strong>{summary?.lowestBaseloadMW?.toLocaleString()} MW</strong> ({summary?.baseloadToPeakRatioPct}% of peak). Peak demand concentration incurs <strong>{fin?.peakPenaltyDailyFormatted}/day</strong> in avoidable utility surcharges.
                </p>
              </div>

              {/* Section 2: AI Forecasting & Anomaly Diagnostics */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--eco-navy)', margin: '0 0 6px 0', borderLeft: '4px solid var(--eco-purple)', paddingLeft: '8px' }}>
                  2. AI Forecasting Reliability & Anomaly Diagnostics
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                  The 1-hour ahead adaptive XGBoost predictive model achieved an <strong>R² accuracy score of {fc?.modelR2Score}</strong> (MAPE: {fc?.modelMAPE}%). Context-aware anomaly isolation flagged <strong>{anom?.totalAnomaliesDetected} statistical events</strong> outside ±3σ dynamic confidence bands ({anom?.criticalSeverityCount} critical events, {anom?.mediumSeverityCount} medium events).
                </p>
              </div>

              {/* Section 3: Prioritized Engineering Recommendations */}
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--eco-navy)', margin: '0 0 10px 0', borderLeft: '4px solid var(--eco-green)', paddingLeft: '8px' }}>
                  3. Prioritized Engineering Optimization & Capital ROI Schedule
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: '2px solid var(--border-card)' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--eco-navy)' }}>ID & Action</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--eco-navy)' }}>Prescribed Solution</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--eco-navy)' }}>Monthly Savings</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--eco-navy)' }}>Peak Relief</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--eco-navy)' }}>Payback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recs.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                          <td style={{ padding: '10px', fontWeight: 700, color: 'var(--eco-navy)', width: '25%' }}>
                            <span className={`badge ${r.priority === 'CRITICAL' ? 'badge-red' : r.priority === 'HIGH' ? 'badge-green' : 'badge-blue'}`} style={{ marginRight: '6px' }}>
                              {r.priority}
                            </span>
                            {r.id}: {r.title}
                          </td>
                          <td style={{ padding: '10px', color: 'var(--text-muted)', width: '40%' }}>
                            {r.suggestedAction}
                          </td>
                          <td style={{ padding: '10px', fontWeight: 800, color: 'var(--eco-green)', width: '15%' }}>
                            {r.savingsFormatted}
                          </td>
                          <td style={{ padding: '10px', fontWeight: 700, color: 'var(--eco-navy)', width: '10%' }}>
                            -{r.peakReductionMW} MW
                          </td>
                          <td style={{ padding: '10px', fontWeight: 700, color: 'var(--eco-purple)', width: '10%' }}>
                            {r.paybackMonths} Mo
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          background: '#F8FAFC',
          borderTop: '1px solid var(--border-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            SmartEnergy OS Enterprise v1.0 • Confidential Management Asset
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              Close
            </button>
            <button onClick={handleExportPDF} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.8rem', opacity: isExporting ? 0.7 : 1 }} disabled={isExporting}>
              <Download size={14} />
              <span>{isExporting ? 'Preparing...' : 'Export PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
