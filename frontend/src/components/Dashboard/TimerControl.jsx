import React, { useState, useEffect } from 'react';

const TimerControl = ({ config }) => {
  const [timeLeft, setTimeLeft] = useState(config.timerValue);
  const [isRunning, setIsRunning] = useState(false);

  // Sync with config when settings change
  useEffect(() => {
    setTimeLeft(config.timerValue);
  }, [config.timerValue]);

  // The Countdown Engine
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft !== "00:00:00") {
      interval = setInterval(() => {
        const [h, m, s] = timeLeft.split(':').map(Number);
        let totalSeconds = h * 3600 + m * 60 + s - 1;

        if (totalSeconds >= 0) {
          const nh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
          const nm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
          const ns = String(totalSeconds % 60).padStart(2, '0');
          setTimeLeft(`${nh}:${nm}:${ns}`);
        } else {
          setIsRunning(false);
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleStart = async () => {
    setIsRunning(!isRunning);
    
    // 📡 This is where the IoT Magic happens:
    // try {
    //   await fetch('http://your-django-ip/api/timer/start/', {
    //     method: 'POST',
    //     body: JSON.stringify({ action: 'start', room: 'Hall A' })
    //   });
    // } catch (err) { console.error("IoT Node Unreachable"); }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No Date Set";
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
  };

  return (
    <div className="max-w-2xl mx-auto mt-4 animate-in fade-in zoom-in duration-500">
      <div className="bg-white border border-slate-200 rounded-4xl overflow-hidden shadow-sm">
        
        {/* 1. TOP BOX */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 text-center">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 block mb-1">
            Active Course
          </span>
          <h2 className="text-3xl font-black text-brand-navy uppercase">
            {config.courseCode || "NO COURSE"}
          </h2>
        </div>

        {/* 2. MIDDLE BOX: The Live Clock */}
        <div className="p-12 text-center bg-white">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 block mb-2">
            Time Remaining
          </span>
          <div className={`text-8xl font-black tracking-tighter transition-colors duration-500 ${
            isRunning ? 'text-brand-purple' : 'text-slate-900'
          }`}>
            {timeLeft}
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className={`w-3 h-3 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
            <span className={`text-sm font-bold tracking-wide uppercase ${isRunning ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isRunning ? 'Timer Running' : 'System Ready'}
            </span>
          </div>
        </div>

        {/* 3. BOTTOM BOX */}
        <div className="bg-brand-navy p-6 text-center text-white/90">
          <span className="text-lg font-semibold tracking-wide">
            📅 {formatDate(config.examDate)}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <button 
          onClick={handleStart}
          className={`font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95 cursor-pointer text-white ${
            isRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-brand-purple hover:brightness-110'
          }`}
        >
          {isRunning ? '⏸ PAUSE TIMER' : '▶ START TIMER'}
        </button>
        
        <button 
          onClick={() => { setIsRunning(false); setTimeLeft(config.timerValue); }}
          className="bg-white border border-slate-200 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-50 transition-all active:scale-95 cursor-pointer"
        >
          ⏹ RESET
        </button>
      </div>
    </div>
  );
};

export default TimerControl;