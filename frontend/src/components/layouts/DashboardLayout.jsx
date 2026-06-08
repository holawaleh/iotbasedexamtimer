import React, { useState } from 'react';
import Sidebar from '../Dashboard/Sidebar';
import TopBar from '../Dashboard/TopBar';

const DashboardLayout = ({ children, pageTitle, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh min-h-screen overflow-hidden bg-slate-100 text-slate-800">
      <Sidebar onLogout={onLogout} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar pageTitle={pageTitle} onLogout={onLogout} onToggleSidebar={() => setSidebarOpen((s) => !s)} />
        <main className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 lg:px-5">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
