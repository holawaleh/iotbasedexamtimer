import React, { useState } from 'react';
import { createHall, createSession, getHalls } from '../../api/client';

const timeToSeconds = (value) => {
  const [h, m, s] = value.split(':').map(Number);
  return h * 3600 + m * 60 + s;
};

const buildStartTime = (date, time) => {
  const safeDate = date || new Date().toISOString().slice(0, 10);
  const safeTime = time || '09:00';
  return new Date(`${safeDate}T${safeTime}:00`).toISOString();
};

const Settings = ({ config, setConfig, token }) => {
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig({ ...config, [name]: value });
  };

  const parseTimerValue = () => {
    const [h, m, s] = config.timerValue.split(':').map(Number);
    return { h, m, s };
  };

  const handleTimeChange = (unit, value) => {
    const { h, m, s } = parseTimerValue();
    let newH = h;
    let newM = m;
    let newS = s;

    if (unit === 'hours') newH = Math.max(0, Math.min(23, parseInt(value, 10) || 0));
    if (unit === 'minutes') newM = Math.max(0, Math.min(59, parseInt(value, 10) || 0));
    if (unit === 'seconds') newS = Math.max(0, Math.min(59, parseInt(value, 10) || 0));

    const formatted = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(newS).padStart(2, '0')}`;
    setConfig({ ...config, timerValue: formatted });
  };

  const findOrCreateHall = async () => {
    const halls = await getHalls(token);
    const existingHall = halls.find(
      (hall) => hall.code === config.hallCode || hall.device_id === config.deviceId,
    );

    if (existingHall) return existingHall;

    return createHall(token, {
      name: config.hallName,
      code: config.hallCode,
      device_id: config.deviceId,
      is_active: true,
    });
  };

  const handleSaveSession = async () => {
    setError('');
    setStatusMessage('');
    setIsSaving(true);

    try {
      const hall = await findOrCreateHall();
      const session = await createSession(token, {
        course_code: config.courseCode,
        course_title: config.courseTitle,
        hall: hall.id,
        start_time: buildStartTime(config.examDate, config.scheduledStartTime),
        duration_seconds: timeToSeconds(config.timerValue),
        status: 'SCHEDULED',
      });

      setConfig({
        ...config,
        hallId: hall.id,
        sessionId: session.id,
        backendStatus: 'Session saved',
        mqttStatus: 'Waiting',
      });
      setStatusMessage(`Session ${session.id} saved for ${hall.name}.`);
    } catch (err) {
      setError(err.message || 'Could not save session');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-slate-200 rounded-4xl p-8 shadow-sm">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Exam Settings</h2>
          <p className="text-slate-500 text-sm">Create the cloud session the ESP32 display will receive.</p>
        </header>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                Hall Name
              </label>
              <input
                type="text"
                name="hallName"
                value={config.hallName}
                onChange={handleChange}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-purple font-bold text-slate-700 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                Hall Code
              </label>
              <input
                type="text"
                name="hallCode"
                value={config.hallCode}
                onChange={handleChange}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-purple font-bold text-slate-700 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                Device ID
              </label>
              <input
                type="text"
                name="deviceId"
                value={config.deviceId}
                onChange={handleChange}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-purple font-bold text-slate-700 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
              Course Code
            </label>
            <input
              type="text"
              name="courseCode"
              value={config.courseCode}
              onChange={handleChange}
              placeholder="e.g. COM 412"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-purple font-bold text-slate-700 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
              Course Title
            </label>
            <input
              type="text"
              name="courseTitle"
              value={config.courseTitle}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-purple font-bold text-slate-700 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
              Timer Duration
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 font-bold block mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={parseTimerValue().h}
                  onChange={(e) => handleTimeChange('hours', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-purple font-mono font-bold text-slate-700 transition-all text-center"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 font-bold block mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={parseTimerValue().m}
                  onChange={(e) => handleTimeChange('minutes', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-purple font-mono font-bold text-slate-700 transition-all text-center"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 font-bold block mb-1">Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={parseTimerValue().s}
                  onChange={(e) => handleTimeChange('seconds', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-purple font-mono font-bold text-slate-700 transition-all text-center"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
              Examination Date
            </label>
            <input
              type="date"
              name="examDate"
              value={config.examDate}
              onChange={handleChange}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-purple font-bold text-slate-700 transition-all cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
              Scheduled Start Time
            </label>
            <input
              type="time"
              name="scheduledStartTime"
              value={config.scheduledStartTime || ''}
              onChange={handleChange}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-purple font-bold text-slate-700 transition-all cursor-pointer"
            />
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-sm text-red-600 font-bold">{error}</p>
          </div>
        )}

        {statusMessage && (
          <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-sm text-emerald-700 font-bold">{statusMessage}</p>
          </div>
        )}

        <button
          onClick={handleSaveSession}
          disabled={isSaving}
          className="mt-8 w-full bg-brand-purple text-white font-bold py-4 rounded-2xl hover:brightness-110 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? 'Saving Session...' : 'Save Cloud Session'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
