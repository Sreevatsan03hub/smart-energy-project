/**
 * ==============================================================================
 * PURE API SERVICE LAYER (Option A: No Mock Data)
 * ==============================================================================
 * Exclusively queries the FastAPI backend on http://localhost:8000/api
 * Shows clean loading & offline states if backend is not running.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

/**
 * Generic authenticated API fetcher
 */
async function fetchFromBackend(endpoint, options = {}) {
  const token = localStorage.getItem('smart_energy_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export const energyApi = {
  // Feature 3: Energy Usage Trends & Multiscale Aggregations
  getTrends: (region = 'PJME', interval = 'daily', startDate = null, endDate = null, limit = null) => {
    const params = new URLSearchParams({ region, interval });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (limit) params.append('limit', limit);
    return fetchFromBackend(`/trends?${params.toString()}`);
  },

  getTrendsSummary: (region = 'PJME', startDate = null, endDate = null) => {
    const params = new URLSearchParams({ region });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return fetchFromBackend(`/trends/summary?${params.toString()}`);
  },

  // Feature 4: Peak & Off-Peak Analytics
  getPeakOffPeakHourly: (region = 'PJME', peakPercentile = 75, offPeakPercentile = 25) => {
    const params = new URLSearchParams({ region, peak_percentile: peakPercentile, off_peak_percentile: offPeakPercentile });
    return fetchFromBackend(`/peak-offpeak/hourly?${params.toString()}`);
  },

  getPeakOffPeakSummary: (region = 'PJME', peakPercentile = 75, offPeakPercentile = 25) => {
    const params = new URLSearchParams({ region, peak_percentile: peakPercentile, off_peak_percentile: offPeakPercentile });
    return fetchFromBackend(`/peak-offpeak/summary?${params.toString()}`);
  },

  getPeakOffPeakWeekday: (region = 'PJME') => {
    return fetchFromBackend(`/peak-offpeak/weekday?region=${region}`);
  },

  getPeakOffPeakMonthly: (region = 'PJME') => {
    return fetchFromBackend(`/peak-offpeak/monthly?region=${region}`);
  },

  // Feature 1: Time-Series Hourly Load Data
  getHourlyLoad: (region = 'PJME', hours = 24) => 
    fetchFromBackend(`/trends/hourly?region=${region}&hours=${hours}`),

  // Feature 1: 1-Hour Live Forecast
  getNextHourForecast: (region = 'PJME') =>
    fetchFromBackend(`/forecast/next-hour?region=${region}`),

  // Feature 1: Model Accuracy Benchmarks
  getModelBenchmark: () =>
    fetchFromBackend(`/forecast/benchmark`),

  // Feature 2: Anomalies
  getAnomalies: (region = 'PJME') =>
    fetchFromBackend(`/anomalies?region=${region}`),

  getLatestCriticalAlert: (region = 'PJME') =>
    fetchFromBackend(`/anomalies/latest-critical?region=${region}`),

  simulateAnomaly: (region = 'PJME', deviationFactor = 0.15, anomalyType = 'SPIKE') =>
    fetchFromBackend(`/anomalies/simulate?region=${region}&deviation_factor=${deviationFactor}&anomaly_type=${anomalyType}`, {
      method: 'POST'
    }),

  // Feature 4: Peak / Off-Peak Analytics Engine
  getPeakAnalytics: async (region = 'PJME') => {
    try {
      const [summary, hourly] = await Promise.all([
        fetchFromBackend(`/peak-offpeak/summary?region=${region}`),
        fetchFromBackend(`/peak-offpeak/hourly?region=${region}`)
      ]);
      return {
        peakWindow: summary.peak_window_str,
        offPeakWindow: summary.off_peak_window_str,
        peakAvgMW: summary.average_peak_mw,
        offPeakAvgMW: summary.average_off_peak_mw,
        peakToAvgRatio: summary.peak_to_average_ratio,
        peakHours: summary.peak_hours,
        offPeakHours: summary.off_peak_hours,
        profile: (hourly?.data || []).map(d => ({
          hour: d.hour,
          label: d.label,
          avgLoadMW: d.average_mw,
          zone: d.classification === 'peak' ? 'PEAK' : d.classification === 'off_peak' ? 'OFF_PEAK' : 'MID'
        }))
      };
    } catch (err) {
      console.error("Peak analytics fetch error:", err);
      return null;
    }
  },

  // Feature 5: Historical Pattern Discovery
  getHourlyPattern: (region = 'PJME') =>
    fetchFromBackend(`/patterns/hourly?region=${region}`),

  getDailyPattern: (region = 'PJME') =>
    fetchFromBackend(`/patterns/daily?region=${region}`),

  getMonthlyPattern: (region = 'PJME') =>
    fetchFromBackend(`/patterns/monthly?region=${region}`),

  getWeekdayWeekendPattern: (region = 'PJME') =>
    fetchFromBackend(`/patterns/weekday-weekend?region=${region}`),

  getPatternSummary: (region = 'PJME') =>
    fetchFromBackend(`/patterns/summary?region=${region}`),

  getPatternsOverview: () =>
    fetchFromBackend(`/patterns/overview`),

  // Feature 5 & 6: Similar Days
  getSimilarDays: (region = 'PJME', date = 'Today') =>
    fetchFromBackend(`/similar-days?region=${region}&date=${date}`),

  // Feature 7: AI Explainability
  getExplainability: (region = 'PJME') =>
    fetchFromBackend(`/explainability?region=${region}`),

  getForecastExplainability: (region = 'PJME') =>
    fetchFromBackend(`/explainability/forecast?region=${region}`),

  getAnomalyExplainability: (region = 'PJME', anomalyId = null) =>
    fetchFromBackend(`/explainability/anomaly?region=${region}${anomalyId ? `&anomaly_id=${anomalyId}` : ''}`),

  // Feature 8: Financial Cost
  getCostImpact: (region = 'PJME', tariff = 8.0) =>
    fetchFromBackend(`/cost?region=${region}&tariff=${tariff}`),

  getCostTrends: (region = 'PJME', tariff = 8.0, interval = 'daily', limit = 30) =>
    fetchFromBackend(`/cost/trends?region=${region}&tariff=${tariff}&interval=${interval}&limit=${limit}`),

  // Feature 9: Energy Health Score
  getHealthScore: (region = 'PJME') =>
    fetchFromBackend(`/health?region=${region}`),

  // Feature 10: Recommendations
  getRecommendations: (region = 'PJME') =>
    fetchFromBackend(`/recommendations?region=${region}`),

  // Feature 11: RAG-Based Energy AI Copilot
  askCopilot: (question, region = 'PJME', userRole = 'admin', assignedRegion = 'ALL', conversationHistory = []) =>
    fetchFromBackend(`/chatbot/query`, {
      method: 'POST',
      body: JSON.stringify({
        question,
        region,
        user_role: userRole,
        assigned_region: assignedRegion,
        conversation_history: conversationHistory
      })
    }),

  // Feature 12: Automated Reports
  generateReport: (region = 'PJME', startDate = null, endDate = null, reportType = 'executive', tariff = 0.12) => {
    let url = `/reports/generate?region=${region}&report_type=${reportType}&tariff=${tariff}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return fetchFromBackend(url);
  },

  getReportHtmlUrl: (region = 'PJME', startDate = null, endDate = null, reportType = 'executive', tariff = 0.12) => {
    let url = `${API_BASE_URL}/reports/download-html?region=${region}&report_type=${reportType}&tariff=${tariff}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return url;
  },

  // Available Regions
  getAllRegionCodes: () => [
    "AEP", "COMED", "DAYTON", "DEOK", "DOM",
    "DUQ", "EKPC", "FE", "NI", "PJME", "PJMW"
  ]
};
