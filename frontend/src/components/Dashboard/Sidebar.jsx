import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ onLogout }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'Grid' },
    { name: 'Settings', path: '/settings', icon: 'Gear' },
  ];

  return (
    <aside className="w-64 bg-brand-navy h-full flex flex-col text-white shadow-xl z-20">
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center font-bold">S</div>
        <span className="text-xl font-bold tracking-tight">SmartExam</span>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive
                  ? 'bg-brand-purple text-white shadow-lg'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="text-xs font-black uppercase tracking-widest">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full px-4 py-3 rounded-xl text-left font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
