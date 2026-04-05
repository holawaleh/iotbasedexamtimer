import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout & UI
import DashboardLayout from './components/layouts/DashboardLayout';
import BrandSection from './components/Landing/BrandSection';
import AuthSection from './components/Landing/AuthSection';

// Components
import StatCard from './components/Dashboard/StatCard';
import TimerControl from './components/Dashboard/TimerControl';
import Settings from './components/Dashboard/Settings';
import ProjectBrief from './components/Dashboard/ProjectBrief';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [examConfig, setConfig] = useState({
    courseCode: "COM 412",
    timerValue: "02:00:00",
    examDate: "2026-04-05"
  });

  return (
    <Router>
      <Routes>
        {/* LOGIN: Horizontal Split Screen */}
        <Route path="/" element={
          !isLoggedIn ? (
            <main className="flex flex-row h-screen w-full overflow-hidden bg-white">
              {/* Left: Dark Brand Area + Project Brief */}
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
              {/* Right: Login Area */}
              <div className="w-1/2 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                  <AuthSection onLoginSuccess={() => setIsLoggedIn(true)} />
                </div>
              </div>
            </main>
          ) : <Navigate to="/dashboard" />
        } />

        <Route path="/dashboard" element={
          isLoggedIn ? (
            <DashboardLayout pageTitle="System Overview">
              <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Hello, Administrator 👋</h1>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <StatCard title="Active Timers" value="01/04" icon="⏱️" color="bg-purple-600" />
                <StatCard title="System Health" value="98%" icon="📡" color="bg-blue-600" />
                <StatCard title="Global Time" value={examConfig.timerValue} icon="⏳" color="bg-orange-500" />
              </div>
              <TimerControl config={examConfig} />
            </DashboardLayout>
          ) : <Navigate to="/" />
        } />

        <Route path="/settings" element={
          isLoggedIn ? (
            <DashboardLayout pageTitle="System Settings">
              <div className="flex flex-col items-center space-y-8 w-full">
                <Settings config={examConfig} setConfig={setConfig} />
              </div>
            </DashboardLayout>
          ) : <Navigate to="/" />
        } />
      </Routes>
    </Router>
  );
}

export default App;