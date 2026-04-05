import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { name: 'Dashboard', icon: '🏠' },
    { name: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-brand-navy h-full flex flex-col text-white shadow-xl z-20">
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center font-bold shadow-lg shadow-purple-500/20">
          S
        </div>
        <span className="text-xl font-bold tracking-tight">SmartExam</span>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveTab(item.name)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all cursor-pointer font-medium ${
              activeTab === item.name 
                ? 'bg-brand-purple text-white shadow-lg' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:text-red-400 transition-colors cursor-pointer font-medium">
          <span>📤</span> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;