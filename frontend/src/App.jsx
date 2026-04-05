import React, { useState } from 'react';
import BrandSection from './components/Landing/BrandSection';
import AuthSection from './components/Landing/AuthSection';
import TopBar from './components/Dashboard/TopBar';
import Sidebar from './components/Dashboard/Sidebar';
import StatCard from './components/Dashboard/StatCard';
import TimerControl from './components/Dashboard/TimerControl';
import Settings from './components/Dashboard/Settings';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  
  // The shared state for the Course, Timer, and Date
  const [examConfig, setExamConfig] = useState({
    courseCode: "COM 412",
    timerValue: "02:00:00",
    examDate: "Thursday, Oct 24, 2026"
  });

  const login = () => setIsLoggedIn(true);

  if (isLoggedIn) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800 font-sans">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar pageTitle={activeTab === 'Dashboard' ? 'System Overview' : 'System Settings'} />
          
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto">
              
              {activeTab === 'Dashboard' ? (
                <>
                  <header className="mb-8 animate-in fade-in slide-in-from-left-4">
                    <h1 className="text-3xl font-bold text-slate-800">Hello, Administrator 👋</h1>
                    <p className="text-slate-500 font-medium">System is active and monitoring IoT nodes.</p>
                  </header>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <StatCard 
                      title="Active Timers" 
                      value="01 / 04" 
                      subtext="Hall A Running" 
                      icon="⏱️" 
                      color="bg-purple-600" 
                    />
                    <StatCard 
                      title="System Health" 
                      value="98%" 
                      subtext="Nodes Online" 
                      icon="📡" 
                      color="bg-blue-600" 
                    />
                    <StatCard 
                      title="Global Time" 
                      value={examConfig.timerValue} 
                      subtext="Time Remaining" 
                      icon="⏳" 
                      color="bg-orange-500" 
                    />
                  </div>

                  {/* The Live Dashboard Window */}
                  <TimerControl config={examConfig} />
                </>
              ) : (
                /* The Settings Page */
                <Settings config={examConfig} setConfig={setExamConfig} />
              )}

            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
      <div className="flex-1">
        <BrandSection title="IOT Based Smart Examination Timing" subtitle="Exam Timer Control Panel" />
      </div>
      <div className="flex-1 bg-white">
        <AuthSection onLoginSuccess={login} />
      </div>
    </main>
  );
}

export default App;