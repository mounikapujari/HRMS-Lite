import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import EmployeesPage from './pages/EmployeesPage';
import AttendancePage from './pages/AttendancePage';
import DepartmentsPage from './pages/DepartmentsPage';
import { useToast } from './hooks/useToast';

function App() {
  const { toasts, addToast, removeToast } = useToast();

  return (
    <Routes>
      <Route path="/" element={<Layout toasts={toasts} removeToast={removeToast} />}>
        <Route index element={<Navigate to="/employees" replace />} />
        <Route path="employees" element={<EmployeesPage addToast={addToast} />} />
        <Route path="attendance" element={<AttendancePage addToast={addToast} />} />
        <Route path="departments" element={<DepartmentsPage addToast={addToast} />} />
        <Route path="*" element={<Navigate to="/employees" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
