import React, { useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import DashboardLayout from './components/layouts/DashboardLayout';
import BrandSection from './components/Landing/BrandSection';
import AuthSection from './components/Landing/AuthSection';
import StatCard from './components/Dashboard/StatCard';
import TimerControl from './components/Dashboard/TimerControl';
import Settings from './components/Dashboard/Settings';
import ProjectBrief from './components/Dashboard/ProjectBrief';

const initialConfig = {
  courseCode: 'COM 412',
  courseTitle: '',
  timerValue: '02:00:00',
  examDate: '2026-04-05',
  scheduledStartTime: '09:00',
  hallName: 'Hall A',
  hallCode: 'hall-a',
  deviceId: 'esp32-hall-a',
  hallId: null,
  sessionId: null,
  backendStatus: 'Not synced',
  mqttStatus: 'Waiting',
};

function App() {
  const [tokens, setTokens] = useState(() => {
    const saved = localStorage.getItem('examTimerTokens');
    return saved ? JSON.parse(saved) : null;
  });
  const [examConfig, setConfig] = useState(initialConfig);

  const isLoggedIn = Boolean(tokens?.access);
  const apiToken = tokens?.access;
  const activeTimerCount = examConfig.sessionId ? '01/04' : '00/04';

  const systemHealth = useMemo(() => {
    if (!examConfig.sessionId) return 'Setup';
    if (examConfig.mqttStatus === 'Published') return 'Online';
    return 'API OK';
  }, [examConfig.sessionId, examConfig.mqttStatus]);

  const handleLoginSuccess = (newTokens) => {
    localStorage.setItem('examTimerTokens', JSON.stringify(newTokens));
    setTokens(newTokens);
  };

  const handleLogout = () => {
    localStorage.removeItem('examTimerTokens');
    setTokens(null);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            !isLoggedIn ? (
              <main className="flex flex-row h-screen w-full overflow-hidden bg-white">
                <div className="w-1/2 bg-[#0f172a] flex flex-col items-center justify-start p-6 overflow-y-auto">
                  <div className="shrink-0">
                    <BrandSection
                      title="IOT Based Smart Examination Timing"
                      subtitle="Exam Timer Control Panel"
                    />
                  </div>
                  <div className="mt-12 w-full flex justify-center">
                    <ProjectBrief />
                  </div>
                </div>
                <div className="w-1/2 flex items-center justify-center p-6">
                  <div className="w-full max-w-md">
                    <AuthSection onLoginSuccess={handleLoginSuccess} />
                  </div>
                </div>
              </main>
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            isLoggedIn ? (
              <DashboardLayout pageTitle="System Overview" onLogout={handleLogout}>
                <header className="mb-8">
                  <h1 className="text-3xl font-bold text-slate-800">Hello, Administrator</h1>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <StatCard title="Active Timers" value={activeTimerCount} icon="Timer" color="bg-purple-600" />
                  <StatCard title="System Health" value={systemHealth} icon="Cloud" color="bg-blue-600" />
                  <StatCard title="Global Time" value={examConfig.timerValue} icon="Clock" color="bg-orange-500" />
                </div>
                <TimerControl config={examConfig} setConfig={setConfig} token={apiToken} />
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/settings"
          element={
            isLoggedIn ? (
              <DashboardLayout pageTitle="System Settings" onLogout={handleLogout}>
                <div className="flex flex-col items-center space-y-8 w-full">
                  <Settings config={examConfig} setConfig={setConfig} token={apiToken} />
                </div>
              </DashboardLayout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
