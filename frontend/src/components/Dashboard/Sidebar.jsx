import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ onLogout, open = false, onClose }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Settings', path: '/settings' },
  ];

  const asideClasses = `fixed inset-y-0 left-0 z-30 flex w-56 transform flex-col bg-brand-navy text-white shadow-xl transition-transform duration-300 md:static md:w-48 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`;

  return (
    <aside className={asideClasses}>
      <div className="flex min-h-12 items-center gap-2 border-b border-white/10 px-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-purple text-sm font-bold">S</div>
        <span className="min-w-0 truncate text-base font-bold tracking-tight">SmartExam</span>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => onClose && onClose()}
            className={({ isActive }) =>
              `flex min-h-10 items-center rounded-md px-3 text-sm font-semibold transition-all ${
                isActive ? 'bg-brand-purple text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-2">
        <button
          onClick={onLogout}
          className="min-h-10 w-full rounded-md px-3 text-left text-sm font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
