import React from 'react';

const Settings = ({ config, setConfig }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig({ ...config, [name]: value });
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

          {/* Countdown Duration - Time Picker */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
              Timer Duration (Click to Scroll)
            </label>
            <input
              type="time"
              step="1" // Allows seconds selection
              name="timerValue"
              value={config.timerValue}
              onChange={handleChange}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-purple font-mono font-bold text-slate-700 transition-all cursor-pointer"
            />
          </div>

          {/* Exam Date - Date Picker */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
              Examination Date (Click to Pop)
            </label>
            <input
              type="date"
              name="examDate"
              value={config.examDate}
              onChange={handleChange}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-purple font-bold text-slate-700 transition-all cursor-pointer"
            />
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