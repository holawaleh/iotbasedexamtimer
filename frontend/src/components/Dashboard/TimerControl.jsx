import React, { useState, useEffect } from 'react';

const TimerControl = ({ config }) => {
  const [timeLeft, setTimeLeft] = useState(config.timerValue);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [stopTime, setStopTime] = useState(null);

  // Update current time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Auto-start timer when current time matches scheduled start time
  useEffect(() => {
    if (!isRunning && config.scheduledStartTime && timeLeft !== "00:00:00") {
      const [scheduledHours, scheduledMinutes] = config.scheduledStartTime.split(':').map(Number);
      const currentHours = currentTime.getHours();
      const currentMinutes = currentTime.getMinutes();
      
      // If current time matches scheduled time (within same minute), auto-start
      if (currentHours === scheduledHours && currentMinutes === scheduledMinutes) {
        setIsRunning(true);
      }
    }
  }, [currentTime, config.scheduledStartTime, isRunning, timeLeft]);

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
          setTimeLeft("00:00:00");
          setIsRunning(false);
          setStopTime(new Date());
          setShowTimeUpPopup(true);
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleStart = async () => {
    if (!isRunning) {
      // Record start time
      const now = new Date();
      setStartTime(now);
    }
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

  const formatTimeDisplay = (date) => {
    if (!date) return "--:--";
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="w-full">
      {/* TOP: Time Envelope Card */}
      {(startTime || stopTime) && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-brand-purple rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex gap-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Start Time</p>
                <p className="text-2xl font-black text-brand-purple">{formatTimeDisplay(startTime)}</p>
              </div>
              <div className="w-px bg-slate-300"></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Stop Time</p>
                <p className="text-2xl font-black text-red-500">{formatTimeDisplay(stopTime)}</p>
              </div>
            </div>
            <div className="text-4xl">✉️</div>
          </div>
        </div>
      )}

      {/* MAIN TIMER CARD */}
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
              {isRunning ? '🟢 RUNNING' : 'System Ready'}
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
          onClick={() => { 
            setIsRunning(false); 
            setTimeLeft(config.timerValue); 
            setShowTimeUpPopup(false);
            setStartTime(null);
            setStopTime(null);
          }}
          className="bg-white border border-slate-200 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-50 transition-all active:scale-95 cursor-pointer"
        >
          ⏹ RESET
        </button>
      </div>
      </div>  

      {/* TIME IS UP POPUP - Rendered at root level of component */}
      {showTimeUpPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in duration-500 transform">
            {/* Red Alert Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-5xl">⏰</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-center text-3xl font-black text-slate-900 mb-2">
              TIME IS UP!
            </h2>

            {/* Course Info */}
            <p className="text-center text-slate-500 font-bold mb-6 text-lg">
              {config.courseCode} - Examination Complete
            </p>

            {/* Message */}
            <p className="text-center text-slate-600 mb-8 leading-relaxed">
              The examination time has reached zero. Please ensure all students have submitted their work.
            </p>

            {/* Time Summary */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-center text-sm">
              <p className="text-slate-600">
                Started: <span className="font-bold text-brand-purple">{formatTimeDisplay(startTime)}</span>
              </p>
              <p className="text-slate-600">
                Finished: <span className="font-bold text-red-500">{formatTimeDisplay(stopTime)}</span>
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowTimeUpPopup(false)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 cursor-pointer text-lg"
            >
              ✓ ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerControl;