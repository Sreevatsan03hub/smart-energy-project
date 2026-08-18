import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import EnergyCopilotDrawer from './components/chatbot/EnergyCopilotDrawer';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardOverview from './pages/DashboardOverview';
import ForecastingStudio from './pages/ForecastingStudio';
import AnomalyDiagnostics from './pages/AnomalyDiagnostics';
import EnergyAnalytics from './pages/EnergyAnalytics';
import OptimizationCenter from './pages/OptimizationCenter';

import { AlertProvider } from './context/AlertContext';
import AnomalyToast from './components/common/AnomalyToast';

function MainApp() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!currentUser) {
    return <LoginPage />;
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="app-container" key={refreshKey}>
      {/* Global Slide-In Anomaly Alert Toast */}
      <AnomalyToast onNavigate={setActiveTab} />

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      <div className="main-content">
        <Navbar 
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onRefresh={handleRefresh}
        />

        <main style={{ flex: 1, backgroundColor: 'var(--bg-canvas)' }}>
          {activeTab === 'overview' && (
            <DashboardOverview onNavigate={setActiveTab} />
          )}

          {activeTab === 'forecasting' && (
            <ForecastingStudio />
          )}

          {activeTab === 'anomalies' && (
            <AnomalyDiagnostics />
          )}

          {activeTab === 'analytics' && (
            <EnergyAnalytics />
          )}

          {activeTab === 'optimization' && (
            <OptimizationCenter />
          )}
        </main>
      </div>

      {/* Floating AI Energy Copilot Assistant */}
      <EnergyCopilotDrawer 
        isOpen={isCopilotOpen} 
        onClose={() => setIsCopilotOpen(false)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <MainApp />
      </AlertProvider>
    </AuthProvider>
  );
}
