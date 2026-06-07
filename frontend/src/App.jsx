import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { getCurrentUser, getActiveSessionsCount } from './api/client';
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
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [examConfig, setConfig] = useState(initialConfig);

  const isLoggedIn = Boolean(tokens?.access && currentUser);
  const apiToken = tokens?.access;
  const [globalTime, setGlobalTime] = useState(() =>
    new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true }),
  );

  const [activeCount, setActiveCount] = useState(0);
  const activeTimerCount = `${String(activeCount).padStart(2, '0')}/04`;

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
    setCurrentUser(null);
  };

  useEffect(() => {
    let isMounted = true;

    async function verifyToken() {
      if (!tokens?.access) {
        setCurrentUser(null);
        setAuthChecked(true);
        return;
      }

      try {
        const user = await getCurrentUser(tokens.access);
        if (isMounted) {
          setCurrentUser(user);
          setAuthChecked(true);
        }
      } catch {
        if (isMounted) {
          handleLogout();
          setAuthChecked(true);
        }
      }
    }

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [tokens?.access]);

  useEffect(() => {
    let stopped = false;
    async function fetchActive() {
      if (!apiToken) return;
      try {
        const data = await getActiveSessionsCount(apiToken);
        if (!stopped) setActiveCount(Number(data.active || 0));
      } catch (err) {
        // ignore; keep previous count
      }
    }

    fetchActive();
    const iv = setInterval(fetchActive, 5000);
    return () => {
      stopped = true;
      clearInterval(iv);
    };
  }, [apiToken]);

  useEffect(() => {
    const t = setInterval(() => {
      setGlobalTime(new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos', hour12: true }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-600 font-bold">
        Connecting to backend...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            !isLoggedIn ? (
              <main className="flex min-h-screen w-full flex-col bg-white lg:flex-row">
                <div className="w-full bg-[#0f172a] flex flex-col items-center justify-start p-4 sm:p-6 lg:w-1/2">
                  <div className="w-full shrink-0">
                    <BrandSection
                      title="IOT Based Smart Examination Timing"
                      subtitle="Exam Timer Control Panel"
                    />
                  </div>
                  <div className="mt-6 w-full flex justify-center lg:mt-10">
                    <ProjectBrief />
                  </div>
                </div>
                <div className="w-full flex items-start justify-center px-4 py-8 sm:px-6 lg:w-1/2 lg:items-center">
                  <div className="w-full max-w-lg">
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
                  <h1 className="text-3xl font-bold text-slate-800">
                    Hello, {currentUser?.username || 'Administrator'}
                  </h1>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <StatCard title="Active Timers" value={activeTimerCount} icon="Timer" color="bg-purple-600" />
                  <StatCard title="System Health" value={systemHealth} icon="Cloud" color="bg-blue-600" />
                  <StatCard title="Global Time" value={globalTime} icon="Clock" color="bg-orange-500" />
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
