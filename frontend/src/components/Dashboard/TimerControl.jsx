import React, { useCallback, useEffect, useState } from 'react';
import { activateSession, finishSession } from '../../api/client';

const TimerControl = ({ config, setConfig, token }) => {
  const [timeLeft, setTimeLeft] = useState(config.timerValue);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [stopTime, setStopTime] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [error, setError] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  const markFinished = useCallback(async () => {
    setTimeLeft('00:00:00');
    setIsRunning(false);
    setStopTime(new Date());
    setShowTimeUpPopup(true);

    if (config.sessionId) {
      try {
        await finishSession(token, config.sessionId);
        setConfig({ ...config, backendStatus: 'FINISHED' });
      } catch {
        setActionMessage('Timer finished locally. Backend finish update could not be sent.');
      }
    }
  }, [config, setConfig, token]);

  const handleStart = useCallback(async () => {
    setError('');
    setActionMessage('');

    if (isRunning) {
      setIsRunning(false);
      setActionMessage('Timer paused locally. The display command remains active in the cloud.');
      return;
    }

    if (!config.sessionId) {
      setError('Save a cloud session in Settings before activating the display.');
      return;
    }

    setIsActivating(true);
    try {
      const activated = await activateSession(token, config.sessionId);
      const mqttPublished = Boolean(activated.mqtt?.published);

      setConfig({
        ...config,
        backendStatus: activated.status,
        mqttStatus: mqttPublished ? 'Published' : 'MQTT disabled',
      });
      setStartTime(new Date());
      setIsRunning(true);
      setActionMessage(
        mqttPublished
          ? `Published to ${activated.mqtt.topic}`
          : 'Session activated in Django. MQTT is disabled or not configured.',
      );
    } catch (err) {
      setError(err.message || 'Could not activate session');
    } finally {
      setIsActivating(false);
    }
  }, [config, isRunning, setConfig, token]);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    if (!isRunning && config.scheduledStartTime && timeLeft !== '00:00:00') {
      const [scheduledHours, scheduledMinutes] = config.scheduledStartTime.split(':').map(Number);
      const currentHours = currentTime.getHours();
      const currentMinutes = currentTime.getMinutes();

      if (currentHours === scheduledHours && currentMinutes === scheduledMinutes && config.sessionId) {
        handleStart();
      }
    }
  }, [config.scheduledStartTime, config.sessionId, currentTime, handleStart, isRunning, timeLeft]);

  useEffect(() => {
    setTimeLeft(config.timerValue);
  }, [config.timerValue]);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft !== '00:00:00') {
      interval = setInterval(() => {
        const [h, m, s] = timeLeft.split(':').map(Number);
        const totalSeconds = h * 3600 + m * 60 + s - 1;

        if (totalSeconds >= 0) {
          const nh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
          const nm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
          const ns = String(totalSeconds % 60).padStart(2, '0');
          setTimeLeft(`${nh}:${nm}:${ns}`);
        } else {
          markFinished();
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, markFinished, timeLeft]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No Date Set';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeDisplay = (date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-US', {
      timeZone: 'Africa/Lagos',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="w-full">
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
            <div className="text-sm font-black uppercase tracking-widest text-slate-400">
              {config.backendStatus}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto mt-4 animate-in fade-in zoom-in duration-500">
        <div className="bg-white border border-slate-200 rounded-4xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 border-b border-slate-100 p-6 text-center">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 block mb-1">
              Active Course
            </span>
            <h2 className="text-3xl font-black text-brand-navy uppercase">
              {config.courseCode || 'NO COURSE'}
            </h2>
            <p className="text-sm text-slate-500 font-semibold mt-2">
              {config.hallName} / {config.deviceId}
            </p>
          </div>

          <div className="p-12 text-center bg-white">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 block mb-2">
              Time Remaining
            </span>
            <div
              className={`text-8xl font-black tracking-tighter transition-colors duration-500 ${
                isRunning ? 'text-brand-purple' : 'text-slate-900'
              }`}
            >
              {timeLeft}
            </div>

            <div className="flex items-center justify-center gap-2 mt-6">
              <span className={`w-3 h-3 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
              <span className={`text-sm font-bold tracking-wide uppercase ${isRunning ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isRunning ? 'Running' : 'System Ready'}
              </span>
            </div>
          </div>

          <div className="bg-brand-navy p-6 text-center text-white/90">
            <span className="text-lg font-semibold tracking-wide">{formatDate(config.examDate)}</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm font-bold text-red-600">
            {error}
          </div>
        )}

        {actionMessage && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm font-bold text-emerald-700">
            {actionMessage}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={handleStart}
            disabled={isActivating}
            className={`font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95 cursor-pointer text-white disabled:cursor-not-allowed disabled:opacity-70 ${
              isRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-brand-purple hover:brightness-110'
            }`}
          >
            {isActivating ? 'ACTIVATING...' : isRunning ? 'PAUSE TIMER' : 'START TIMER'}
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(config.timerValue);
              setShowTimeUpPopup(false);
              setStartTime(null);
              setStopTime(null);
              setActionMessage('');
              setError('');
            }}
            className="bg-white border border-slate-200 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-50 transition-all active:scale-95 cursor-pointer"
          >
            RESET
          </button>
        </div>
      </div>

      {showTimeUpPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in duration-500 transform">
            <h2 className="text-center text-3xl font-black text-slate-900 mb-2">
              TIME IS UP!
            </h2>
            <p className="text-center text-slate-500 font-bold mb-6 text-lg">
              {config.courseCode} - Examination Complete
            </p>
            <p className="text-center text-slate-600 mb-8 leading-relaxed">
              The examination time has reached zero. Please ensure all students have submitted their work.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-center text-sm">
              <p className="text-slate-600">
                Started: <span className="font-bold text-brand-purple">{formatTimeDisplay(startTime)}</span>
              </p>
              <p className="text-slate-600">
                Finished: <span className="font-bold text-red-500">{formatTimeDisplay(stopTime)}</span>
              </p>
            </div>
            <button
              onClick={() => setShowTimeUpPopup(false)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 cursor-pointer text-lg"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerControl;
