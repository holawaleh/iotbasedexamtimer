import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { activateSession, finishSession } from '../../api/client';

const safeTimerValue = (value) => value || '00:00:00';

const secondsToTimer = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const h = String(Math.floor(safeSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(safeSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const timerToSeconds = (value) => {
  const [h = 0, m = 0, s = 0] = safeTimerValue(value).split(':').map((part) => Number(part) || 0);
  return h * 3600 + m * 60 + s;
};

const TimerControl = ({ config, setConfig, token }) => {
  const [timeLeft, setTimeLeft] = useState(safeTimerValue(config.timerValue));
  const [isRunning, setIsRunning] = useState(false);
  const [now, setNow] = useState(new Date());
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [stopTime, setStopTime] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [error, setError] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const hasSession = Boolean(config.sessionId);
  const scheduledDate = useMemo(() => {
    if (!config.scheduledStartAt) return null;
    const parsed = new Date(config.scheduledStartAt);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [config.scheduledStartAt]);

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
      setError('Save a session in Settings before activating the display.');
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
    const timeInterval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    if (!hasSession || isRunning || isActivating || !scheduledDate) return;
    if (now.getTime() >= scheduledDate.getTime() && timeLeft !== '00:00:00') {
      handleStart();
    }
  }, [handleStart, hasSession, isActivating, isRunning, now, scheduledDate, timeLeft]);

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(safeTimerValue(config.timerValue));
    }
  }, [config.timerValue, isRunning]);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft !== '00:00:00') {
      interval = setInterval(() => {
        const totalSeconds = timerToSeconds(timeLeft) - 1;

        if (totalSeconds >= 0) {
          setTimeLeft(secondsToTimer(totalSeconds));
        } else {
          markFinished();
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, markFinished, timeLeft]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
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

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(safeTimerValue(config.timerValue));
    setShowTimeUpPopup(false);
    setStartTime(null);
    setStopTime(null);
    setActionMessage('');
    setError('');
  };

  const secondsUntilStart = scheduledDate ? Math.max(0, Math.ceil((scheduledDate.getTime() - now.getTime()) / 1000)) : 0;
  const statusLabel = isRunning ? 'Running' : secondsUntilStart > 0 ? `Scheduled in ${secondsToTimer(secondsUntilStart)}` : 'Ready';

  if (!hasSession) {
    return (
      <section className="mx-auto w-full max-w-2xl rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="break-words text-xl font-bold text-slate-900">No exam session selected</h2>
        <p className="mt-2 max-w-xl break-words text-sm leading-relaxed text-slate-500">
          Register or select a display in Settings, then save an exam session for that device.
        </p>
      </section>
    );
  }

  return (
    <div className="w-full min-w-0">
      {(startTime || stopTime) && (
        <div className="mb-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-slate-500">Start Time</p>
              <p className="break-words text-lg font-black text-brand-purple">{formatTimeDisplay(startTime)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-slate-500">Stop Time</p>
              <p className="break-words text-lg font-black text-red-500">{formatTimeDisplay(stopTime)}</p>
            </div>
            {config.backendStatus && (
              <div className="min-w-0 break-words text-sm font-black uppercase text-slate-500">{config.backendStatus}</div>
            )}
          </div>
        </div>
      )}

      <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-4 text-center sm:px-5">
          <span className="block text-xs font-black uppercase text-slate-500">Course</span>
          <h2 className="mt-1 break-words text-2xl font-black uppercase leading-tight text-brand-navy sm:text-3xl">
            {config.courseCode}
          </h2>
          {(config.hallName || config.deviceId) && (
            <p className="mt-2 break-words text-sm font-semibold text-slate-500">
              {[config.hallName, config.deviceId].filter(Boolean).join(' / ')}
            </p>
          )}
        </div>

        <div className="bg-white px-4 py-6 text-center sm:px-6 sm:py-8">
          <span className="block text-xs font-black uppercase text-slate-500">Time Remaining</span>
          <div
            className={`mx-auto mt-2 max-w-full break-words font-mono text-[clamp(2.6rem,12vw,5.5rem)] font-black leading-none transition-colors duration-500 ${
              isRunning ? 'text-brand-purple' : 'text-slate-900'
            }`}
          >
            {timeLeft}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className={`h-3 w-3 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className={`break-words text-sm font-bold uppercase ${isRunning ? 'text-emerald-600' : 'text-slate-500'}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {(config.examDate || scheduledDate) && (
          <div className="bg-brand-navy px-4 py-3 text-center text-white/90">
            <span className="break-words text-base font-semibold">
              {scheduledDate ? `${formatDate(scheduledDate)} at ${formatTimeDisplay(scheduledDate)}` : formatDate(config.examDate)}
            </span>
          </div>
        )}
      </section>

      {error && (
        <div className="mx-auto mt-4 max-w-3xl rounded-md border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      {actionMessage && (
        <div className="mx-auto mt-4 max-w-3xl rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {actionMessage}
        </div>
      )}

      <div className="mx-auto mt-4 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={handleStart}
          disabled={isActivating}
          className={`min-h-12 rounded-md px-4 text-base font-bold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 ${
            isRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-brand-purple hover:brightness-110'
          }`}
        >
          {isActivating ? 'ACTIVATING...' : isRunning ? 'PAUSE TIMER' : 'START TIMER'}
        </button>

        <button
          onClick={resetTimer}
          className="min-h-12 rounded-md border border-slate-200 bg-white px-4 text-base font-bold text-red-500 transition-all hover:bg-red-50 active:scale-[0.99]"
        >
          RESET
        </button>
      </div>

      {showTimeUpPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-md bg-white p-5 shadow-2xl sm:p-6">
            <h2 className="break-words text-center text-2xl font-black text-slate-900 sm:text-3xl">TIME IS UP!</h2>
            <p className="mt-2 break-words text-center text-base font-bold text-slate-500">
              {config.courseCode} - Examination Complete
            </p>
            <p className="mt-5 break-words text-center leading-relaxed text-slate-600">
              The examination time has reached zero. Please ensure all students have submitted their work.
            </p>
            <div className="mt-5 rounded-md bg-slate-50 p-4 text-center text-sm">
              <p className="break-words text-slate-600">
                Started: <span className="font-bold text-brand-purple">{formatTimeDisplay(startTime)}</span>
              </p>
              <p className="break-words text-slate-600">
                Finished: <span className="font-bold text-red-500">{formatTimeDisplay(stopTime)}</span>
              </p>
            </div>
            <button
              onClick={() => setShowTimeUpPopup(false)}
              className="mt-5 min-h-12 w-full rounded-md bg-red-500 px-4 text-base font-bold text-white transition-all hover:bg-red-600 active:scale-[0.99]"
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
