import React from 'react';

const TopBar = ({ pageTitle = 'Dashboard', onLogout, onToggleSidebar }) => {
  return (
    <header className="sticky top-0 z-10 flex min-h-12 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand-purple md:hidden"
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="min-w-0 truncate text-base font-bold text-brand-navy">{pageTitle}</h2>
      </div>

      <button
        onClick={onLogout}
        className="min-h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-600"
      >
        Logout
      </button>
    </header>
  );
};

export default TopBar;
