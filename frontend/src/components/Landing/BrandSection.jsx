import React from 'react';

// We use { title, subtitle } to destructure the props object immediately
const BrandSection = ({ title, subtitle }) => {
  return (
    <div className="h-full bg-brand-navy flex flex-col items-center justify-center text-center p-10 border-r border-white/10">
      
      {/* 🎓 Graduation Cap Icon */}
      <div className="mb-8">
        <svg 
          className="w-24 h-24 text-brand-purple mx-auto drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
          <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
        </svg>
      </div>

      {/* 🏷️ Dynamic Title from Props */}
      <h1 className="text-white text-4xl lg:text-5xl font-bold mb-6 tracking-tight leading-tight">
        {title}
      </h1>

      {/* 📄 Dynamic Subtitle from Props */}
      <p className="text-slate-400 text-lg max-w-md mx-auto font-medium">
        {subtitle}
      </p>

      {/* ✨ Optional decorative element like the Cisco "wavy" shapes */}
      <div className="absolute bottom-0 left-0 opacity-10 pointer-events-none">
         <div className="w-64 h-64 rounded-full border-4 border-brand-purple -ml-20 -mb-20"></div>
      </div>
    </div>
  );
};

export default BrandSection;