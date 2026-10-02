import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';
import Toast from './Toast';

const Layout = ({ toasts = [], removeToast = () => {} }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Mobile Top Navigation */}
      <MobileNavigation />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1">
          <Outlet />
        </div>
      </main>

      {/* Global Floating Toast Notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Layout;
