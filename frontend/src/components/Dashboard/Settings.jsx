import React, { useEffect, useState } from 'react';
import { createHall, createSession, getHalls } from '../../api/client';

const timeToSeconds = (value) => {
  const [h = 0, m = 0, s = 0] = (value || '00:00:00').split(':').map((part) => Number(part) || 0);
  return h * 3600 + m * 60 + s;
};

const buildStartTime = (date, time) => new Date(`${date}T${time}:00`).toISOString();

const Settings = ({ config, setConfig, token }) => {
  const [halls, setHalls] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [deviceMessage, setDeviceMessage] = useState('');
  const [error, setError] = useState('');
  const [deviceError, setDeviceError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  const selectedHall = halls.find((hall) => String(hall.id) === String(config.hallId));

  const loadDevices = async () => {
    if (!token) return;
    setIsLoadingDevices(true);
    try {
      const data = await getHalls(token);
      setHalls(Array.isArray(data) ? data : []);
    } catch (err) {
      setDeviceError(err.message || 'Could not load registered devices');
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig({ ...config, [name]: value });
  };

  const handleDeviceSelect = (e) => {
    const hall = halls.find((item) => String(item.id) === e.target.value);
    if (!hall) {
      setConfig({ ...config, hallId: null, hallName: '', hallCode: '', deviceId: '' });
      return;
    }

    setConfig({
      ...config,
      hallId: hall.id,
      hallName: hall.name,
      hallCode: hall.code,
      deviceId: hall.device_id,
    });
  };

  const parseTimerValue = () => {
    const [h = 0, m = 0, s = 0] = (config.timerValue || '00:00:00')
      .split(':')
      .map((part) => Number(part) || 0);
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

  const validateDevice = () => {
    const requiredFields = [
      ['Hall Name', config.hallName],
      ['Hall Code', config.hallCode],
      ['Device ID', config.deviceId],
    ];
    const missing = requiredFields.filter(([, value]) => !String(value || '').trim()).map(([label]) => label);
    return missing.length ? `Please fill: ${missing.join(', ')}.` : '';
  };

  const handleRegisterDevice = async () => {
    setDeviceError('');
    setDeviceMessage('');

    const validationError = validateDevice();
    if (validationError) {
      setDeviceError(validationError);
      return;
    }

    setIsRegistering(true);
    try {
      const hall = await createHall(token, {
        name: config.hallName.trim(),
        code: config.hallCode.trim(),
        device_id: config.deviceId.trim(),
        is_active: true,
      });

      setHalls((current) => [...current.filter((item) => item.id !== hall.id), hall]);
      setConfig({ ...config, hallId: hall.id, hallName: hall.name, hallCode: hall.code, deviceId: hall.device_id });
      setDeviceMessage(`${hall.name} registered for device ${hall.device_id}.`);
    } catch (err) {
      setDeviceError(err.message || 'Could not register device');
    } finally {
      setIsRegistering(false);
    }
  };

  const validateSession = () => {
    const requiredFields = [
      ['Registered Display Device', config.hallId],
      ['Course Code', config.courseCode],
      ['Examination Date', config.examDate],
      ['Scheduled Start Time', config.scheduledStartTime],
    ];

    const missing = requiredFields.filter(([, value]) => !String(value || '').trim()).map(([label]) => label);
    if (missing.length) {
      return `Please fill: ${missing.join(', ')}.`;
    }

    if (timeToSeconds(config.timerValue) < 60) {
      return 'Timer duration must be at least 1 minute.';
    }

    return '';
  };

  const handleSaveSession = async () => {
    setError('');
    setStatusMessage('');

    const validationError = validateSession();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const startTime = buildStartTime(config.examDate, config.scheduledStartTime);
      const session = await createSession(token, {
        course_code: config.courseCode.trim(),
        course_title: config.courseTitle.trim(),
        hall: config.hallId,
        start_time: startTime,
        duration_seconds: timeToSeconds(config.timerValue),
        status: 'SCHEDULED',
      });

      const hall = session.hall_detail || selectedHall;
      setConfig({
        ...config,
        hallId: hall?.id || config.hallId,
        hallName: hall?.name || config.hallName,
        hallCode: hall?.code || config.hallCode,
        deviceId: hall?.device_id || config.deviceId,
        sessionId: session.id,
        scheduledStartAt: session.start_time || startTime,
        backendStatus: 'Scheduled',
        mqttStatus: 'Waiting',
      });
      setStatusMessage(`Session ${session.id} scheduled for ${hall?.name || 'selected display'}.`);
    } catch (err) {
      setError(err.message || 'Could not save session');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <header className="mb-4 min-w-0">
          <h2 className="break-words text-xl font-bold text-slate-800">Display Device</h2>
          <p className="break-words text-sm text-slate-500">
            Add each ESP32 display with its unique device ID, then choose the display for a session.
          </p>
        </header>

        <div className="space-y-4">
          <div>
            <label className="mb-2 ml-1 block break-words text-xs font-black uppercase text-slate-500">
              Registered Devices
            </label>
            <select
              value={config.hallId || ''}
              onChange={handleDeviceSelect}
              className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 p-3 font-bold text-slate-700 transition-all focus:border-brand-purple focus:outline-none"
            >
              <option value="">Select a registered display</option>
              {halls.map((hall) => (
                <option key={hall.id} value={hall.id}>
                  {hall.name} - {hall.device_id}
                </option>
              ))}
            </select>
            {isLoadingDevices && <p className="mt-2 text-xs font-bold text-slate-500">Loading devices...</p>}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 ml-1 block break-words text-xs font-black uppercase text-slate-500">
                Hall Name
              </label>
              <input
                type="text"
                name="hallName"
                value={config.hallName}
                onChange={handleChange}
                className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 p-3 font-bold text-slate-700 transition-all focus:border-brand-purple focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 ml-1 block break-words text-xs font-black uppercase text-slate-500">
                Hall Code
              </label>
              <input
                type="text"
                name="hallCode"
                value={config.hallCode}
                onChange={handleChange}
                className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 p-3 font-bold text-slate-700 transition-all focus:border-brand-purple focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 ml-1 block break-words text-xs font-black uppercase text-slate-500">
                Device ID
              </label>
              <input
                type="text"
                name="deviceId"
                value={config.deviceId}
                onChange={handleChange}
                className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 p-3 font-bold text-slate-700 transition-all focus:border-brand-purple focus:outline-none"
              />
            </div>
          </div>
        </div>

        {deviceError && (
          <div className="mt-4 rounded-md border border-red-100 bg-red-50 p-4">
            <p className="break-words text-sm font-bold text-red-600">{deviceError}</p>
          </div>
        )}

        {deviceMessage && (
          <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 p-4">
            <p className="break-words text-sm font-bold text-emerald-700">{deviceMessage}</p>
          </div>
        )}

        <button
          onClick={handleRegisterDevice}
          disabled={isRegistering}
          className="mt-5 min-h-11 w-full cursor-pointer rounded-md border border-brand-purple bg-white px-4 font-bold text-brand-purple transition-all hover:bg-purple-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isRegistering ? 'Registering Device...' : 'Register Device'}
        </button>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <header className="mb-4 min-w-0">
          <h2 className="break-words text-xl font-bold text-slate-800">Exam Session</h2>
          <p className="break-words text-sm text-slate-500">Schedule the course and countdown for the selected display.</p>
        </header>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 ml-1 block break-words text-xs font-black uppercase text-slate-500">
                Course Code
              </label>
              <input
                type="text"
                name="courseCode"
                value={config.courseCode}
                onChange={handleChange}
                className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 p-3 font-bold text-slate-700 transition-all focus:border-brand-purple focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 ml-1 block break-words text-xs font-black uppercase text-slate-500">
                Course Title
              </label>
              <input
                type="text"
                name="courseTitle"
                value={config.courseTitle}
                onChange={handleChange}
                className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 p-3 font-bold text-slate-700 transition-all focus:border-brand-purple focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 ml-1 block break-words text-xs font-black uppercase text-slate-500">
              Timer Duration
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={parseTimerValue().h}
                  onChange={(e) => handleTimeChange('hours', e.target.value)}
                  className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-center font-mono font-bold text-slate-700 transition-all focus:border-brand-purple focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={parseTimerValue().m}
                  onChange={(e) => handleTimeChange('minutes', e.target.value)}
                  className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-center font-mono font-bold text-slate-700 transition-all focus:border-brand-purple focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={parseTimerValue().s}
                  onChange={(e) => handleTimeChange('seconds', e.target.value)}
                  className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-center font-mono font-bold text-slate-700 transition-all focus:border-brand-purple focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 ml-1 block break-words text-xs font-black uppercase text-slate-500">
                Examination Date
              </label>
              <input
                type="date"
                name="examDate"
                value={config.examDate}
                onChange={handleChange}
                className="min-h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-slate-50 p-3 font-bold text-slate-700 transition-all focus:border-brand-purple focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 ml-1 block break-words text-xs font-black uppercase text-slate-500">
                Scheduled Start Time
              </label>
              <input
                type="time"
                name="scheduledStartTime"
                value={config.scheduledStartTime || ''}
                onChange={handleChange}
                className="min-h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-slate-50 p-3 font-bold text-slate-700 transition-all focus:border-brand-purple focus:outline-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-100 bg-red-50 p-4">
            <p className="break-words text-sm font-bold text-red-600">{error}</p>
          </div>
        )}

        {statusMessage && (
          <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 p-4">
            <p className="break-words text-sm font-bold text-emerald-700">{statusMessage}</p>
          </div>
        )}

        <button
          onClick={handleSaveSession}
          disabled={isSaving}
          className="mt-5 min-h-12 w-full cursor-pointer rounded-md bg-brand-purple px-4 font-bold text-white transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? 'Saving Session...' : 'Save Session'}
        </button>
      </section>
    </div>
  );
};

export default Settings;
