import React from 'react';
import Sidebar from '../Dashboard/Sidebar';
import TopBar from '../Dashboard/TopBar';

const DashboardLayout = ({ children, pageTitle, onLogout }) => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto p-8 flex justify-center">
          <div className="w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
