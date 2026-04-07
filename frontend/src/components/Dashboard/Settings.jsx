import React from 'react';

const Settings = ({ config, setConfig }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig({ ...config, [name]: value });
  };

  // Parse timer value to get individual hours, minutes, seconds
  const parseTimerValue = () => {
    const [h, m, s] = config.timerValue.split(':').map(Number);
    return { h, m, s };
  };

  // Handle time unit changes (hours, minutes, seconds)
  const handleTimeChange = (unit, value) => {
    const { h, m, s } = parseTimerValue();
    let newH = h, newM = m, newS = s;
    
    if (unit === 'hours') newH = Math.max(0, Math.min(23, parseInt(value) || 0));
    if (unit === 'minutes') newM = Math.max(0, Math.min(59, parseInt(value) || 0));
    if (unit === 'seconds') newS = Math.max(0, Math.min(59, parseInt(value) || 0));
    
    const formatted = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(newS).padStart(2, '0')}`;
    setConfig({ ...config, timerValue: formatted });
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-slate-200 rounded-4xl p-8 shadow-sm">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Exam Settings</h2>
          <p className="text-slate-500 text-sm">Update the IoT display parameters here.</p>
        </header>

        <div className="space-y-6">
          {/* Course Code */}
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

          {/* Countdown Duration - Time Picker with separate H/M/S */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
              Timer Duration (Hours : Minutes : Seconds)
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

          {/* Exam Date - Date Picker */}
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

          {/* Scheduled Start Time - to auto-start timer */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
              Scheduled Start Time (Auto-start)
            </label>
            <input
              type="time"
              name="scheduledStartTime"
              value={config.scheduledStartTime || ''}
              onChange={handleChange}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-purple font-bold text-slate-700 transition-all cursor-pointer"
              placeholder="HH:MM"
            />
            <p className="text-xs text-slate-500 mt-2">Timer will auto-start when current time matches this time.</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
          <p className="text-xs text-emerald-700 font-bold flex items-center gap-2">
            <span>✅</span> Interface updated to native scrollers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;