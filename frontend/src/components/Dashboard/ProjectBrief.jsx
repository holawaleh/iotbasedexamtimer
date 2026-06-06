import React from 'react';

const ProjectBrief = () => {
  return (
    <div className="w-full max-w-2xl mx-auto py-4 sm:py-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 sm:p-8 shadow-sm relative overflow-hidden">
        <h3 className="text-purple-400 font-bold text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          System Technical Brief
        </h3>
        
        <div className="grid grid-cols-1 gap-5 text-sm text-slate-300 leading-relaxed break-words">
          <p>
            The <span className="font-bold text-white">IoT Exam Timer</span> is a centralized control system. 
            This Device ensures the actual timing duration in examination hall to ensure fair timing.
          </p>
          <p>
            When set, it triggers a countdown timer update and start broadcasting <span className="font-bold text-white">Course Code</span> and <span className="font-bold text-purple-400">Timer</span> to the connected devices.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectBrief;
