import React, { useEffect, useMemo, useState } from 'react';
import { getDisplayLogs, getHalls, sendEmergencyMessage } from '../../api/client';
import TimerControl from './TimerControl';

const formatLogTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DashboardHome = ({ config, setConfig, token, username }) => {
  const [halls, setHalls] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedHallId, setSelectedHallId] = useState(config.hallId || '');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const selectedHall = useMemo(
    () => halls.find((hall) => String(hall.id) === String(selectedHallId)),
    [halls, selectedHallId],
  );

  const loadDashboardData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [hallData, logData] = await Promise.all([getHalls(token), getDisplayLogs(token)]);
      const nextHalls = Array.isArray(hallData) ? hallData : [];
      const nextLogs = Array.isArray(logData) ? logData : logData.results || [];
      setHalls(nextHalls);
      setLogs(nextLogs.slice(0, 8));
      if (!selectedHallId && config.hallId) setSelectedHallId(config.hallId);
    } catch (err) {
      setError(err.message || 'Could not load dashboard records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  useEffect(() => {
    if (config.hallId) setSelectedHallId(config.hallId);
  }, [config.hallId]);

  const handleSendEmergency = async () => {
    setError('');
    setNotice('');

    const cleanMessage = message.trim();
    if (!selectedHallId) {
      setError('Select a registered display before sending an emergency message.');
      return;
    }
    if (!cleanMessage) {
      setError('Enter an emergency message.');
      return;
    }

    setIsSending(true);
    try {
      const result = await sendEmergencyMessage(token, selectedHallId, cleanMessage);
      setNotice(result.mqtt?.published ? 'Emergency message sent to the display.' : 'Emergency saved. MQTT is not currently publishing.');
      setMessage('');
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Could not send emergency message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="min-w-0">
        <h1 className="break-words text-lg font-bold leading-tight text-slate-800 sm:text-xl">
          Hello, {username || 'Administrator'}
        </h1>
      </header>

      <TimerControl config={config} setConfig={setConfig} token={token} />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="break-words text-base font-bold text-slate-900">Recent Activity</h2>
            <button
              onClick={loadDashboardData}
              className="min-h-9 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {isLoading && <p className="text-sm font-semibold text-slate-500">Loading records...</p>}

          {!isLoading && logs.length === 0 && (
            <p className="break-words text-sm leading-relaxed text-slate-500">
              No display activity has been recorded yet. Session starts, finishes, and emergency messages will appear here.
            </p>
          )}

          {logs.length > 0 && (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (
                <article key={log.id} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                  <p className="text-xs font-bold uppercase text-slate-400">{formatLogTime(log.created_at)}</p>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-bold text-slate-800">
                      {log.event} {log.hall_detail?.name ? `- ${log.hall_detail.name}` : ''}
                    </p>
                    <p className="mt-1 break-words text-xs leading-relaxed text-slate-500">
                      {log.payload?.course || log.payload?.message || log.message || log.topic || 'Display event recorded'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-md border border-red-100 bg-white p-4 shadow-sm">
          <h2 className="break-words text-base font-bold text-slate-900">Emergency Message</h2>
          <p className="mt-1 break-words text-sm leading-relaxed text-slate-500">
            Send a short notice to one registered display.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-2 ml-1 block text-xs font-black uppercase text-slate-500">Display</label>
              <select
                value={selectedHallId}
                onChange={(event) => setSelectedHallId(event.target.value)}
                className="min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700 focus:border-brand-purple focus:outline-none"
              >
                <option value="">Select display</option>
                {halls.map((hall) => (
                  <option key={hall.id} value={hall.id}>
                    {hall.name} - {hall.device_id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 ml-1 block text-xs font-black uppercase text-slate-500">Message</label>
              <textarea
                value={message}
                maxLength={180}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700 focus:border-brand-purple focus:outline-none"
              />
              <p className="mt-1 text-right text-xs font-semibold text-slate-400">{message.length}/180</p>
            </div>
          </div>

          {selectedHall && (
            <p className="mt-3 break-words rounded-md bg-slate-50 p-3 text-xs font-semibold text-slate-500">
              Target: {selectedHall.code} / {selectedHall.device_id}
            </p>
          )}

          {error && <p className="mt-3 break-words text-sm font-bold text-red-600">{error}</p>}
          {notice && <p className="mt-3 break-words text-sm font-bold text-emerald-700">{notice}</p>}

          <button
            onClick={handleSendEmergency}
            disabled={isSending}
            className="mt-4 min-h-11 w-full rounded-md bg-red-500 px-4 font-bold text-white transition-all hover:bg-red-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSending ? 'Sending...' : 'Send Emergency'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default DashboardHome;
