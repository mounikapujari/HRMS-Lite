import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, CalendarCheck, Building2, Briefcase } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    {
      name: 'Employees',
      path: '/employees',
      icon: Users,
    },
    {
      name: 'Attendance',
      path: '/attendance',
      icon: CalendarCheck,
    },
    {
      name: 'Departments',
      path: '/departments',
      icon: Building2,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 min-h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide">HRMS Lite</h1>
          <p className="text-xs text-slate-400 font-medium">HR Management</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-4 space-y-1.5">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Main Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 m-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400">
        <p className="font-semibold text-slate-300">HRMS Lite v1.0</p>
        <p className="mt-0.5 text-slate-500">Full-Stack MERN Edition</p>
      </div>
    </aside>
  );
};

export default Sidebar;
