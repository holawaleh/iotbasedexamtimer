import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { getCurrentUser } from './api/client';
import DashboardLayout from './components/layouts/DashboardLayout';
import BrandSection from './components/Landing/BrandSection';
import AuthSection from './components/Landing/AuthSection';
import DashboardHome from './components/Dashboard/DashboardHome';
import Settings from './components/Dashboard/Settings';
import ProjectBrief from './components/Dashboard/ProjectBrief';

const initialConfig = {
  courseCode: '',
  courseTitle: '',
  timerValue: '00:00:00',
  examDate: '',
  scheduledStartTime: '',
  scheduledStartAt: '',
  hallName: '',
  hallCode: '',
  deviceId: '',
  hallId: null,
  sessionId: null,
  backendStatus: '',
  mqttStatus: '',
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
      } catch (err) {
        console.error(err);
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
              <DashboardLayout pageTitle="Dashboard" onLogout={handleLogout}>
                <DashboardHome
                  config={examConfig}
                  setConfig={setConfig}
                  token={apiToken}
                  username={currentUser?.username}
                />
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
                <div className="w-full">
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


