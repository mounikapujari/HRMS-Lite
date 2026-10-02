import React, { useState, useEffect, useCallback } from 'react';
import { attendanceAPI, employeeAPI, departmentAPI } from '../services/api';
import StatCard from '../components/StatCard';
import FilterDropdown from '../components/FilterDropdown';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import AttendanceForm from '../components/AttendanceForm';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { formatDateDisplay, getTodayString, getFirstDayOfMonthString } from '../utils/formatDate';
import {
  CalendarCheck,
  Plus,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  BarChart2,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const AttendancePage = ({ addToast }) => {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'summary'

  // Data states
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
  });
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters for daily view
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Summary state
  const [summaryData, setSummaryData] = useState([]);
  const [summaryStartDate, setSummaryStartDate] = useState(getFirstDayOfMonthString());
  const [summaryEndDate, setSummaryEndDate] = useState(getTodayString());
  const [summaryDept, setSummaryDept] = useState('all');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [formServerError, setFormServerError] = useState('');

  // Delete state
  const [deletingAttendance, setDeletingAttendance] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await attendanceAPI.getStats();
      setStats(res);
    } catch (err) {
      console.error('Failed to fetch stats:', err.message);
    }
  }, []);

  const fetchOptions = useCallback(async () => {
    try {
      const empRes = await employeeAPI.getAll({ isActive: true });
      setEmployees(empRes.data || []);
      const deptRes = await departmentAPI.getAll();
      setDepartments(deptRes.data || []);
    } catch (err) {
      console.error('Failed to fetch filter options:', err.message);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedDate) params.date = selectedDate;
      else {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      if (selectedEmployee !== 'all') params.employee = selectedEmployee;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const res = await attendanceAPI.getAll(params);
      setAttendance(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load attendance records.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, startDate, endDate, selectedEmployee, selectedStatus]);

  const fetchSummary = useCallback(async () => {
    setIsSummaryLoading(true);
    try {
      const params = {
        startDate: summaryStartDate,
        endDate: summaryEndDate,
      };
      if (summaryDept !== 'all') params.department = summaryDept;

      const res = await attendanceAPI.getSummary(params);
      setSummaryData(res.data || []);
    } catch (err) {
      console.error('Failed to load summary:', err.message);
    } finally {
      setIsSummaryLoading(false);
    }
  }, [summaryStartDate, summaryEndDate, summaryDept]);

  useEffect(() => {
    fetchStats();
    fetchOptions();
  }, [fetchStats, fetchOptions]);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchAttendance();
    } else {
      fetchSummary();
    }
  }, [activeTab, fetchAttendance, fetchSummary]);

  // Form handlers
  const handleOpenMarkModal = () => {
    setEditingAttendance(null);
    setFormServerError('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setEditingAttendance(record);
    setFormServerError('');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsFormSubmitting(true);
    setFormServerError('');
    try {
      if (editingAttendance) {
        await attendanceAPI.update(editingAttendance._id, formData);
        addToast('Attendance updated successfully!', 'success');
      } else {
        await attendanceAPI.create(formData);
        addToast('Attendance marked successfully!', 'success');
      }
      setIsFormModalOpen(false);
      fetchAttendance();
      fetchStats();
    } catch (err) {
      setFormServerError(err.message || 'Failed to save attendance record.');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAttendance) return;
    setIsDeleting(true);
    try {
      await attendanceAPI.delete(deletingAttendance._id);
      addToast('Attendance record deleted!', 'success');
      setDeletingAttendance(null);
      fetchAttendance();
      fetchStats();
    } catch (err) {
      addToast(err.message || 'Failed to delete record.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const employeeOptions = [
    { label: 'All Employees', value: 'all' },
    ...employees.map((e) => ({ label: `${e.employeeId} - ${e.fullName}`, value: e._id })),
  ];

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Present', value: 'Present' },
    { label: 'Absent', value: 'Absent' },
    { label: 'Late', value: 'Late' },
  ];

  const deptOptions = [
    { label: 'All Departments', value: 'all' },
    ...departments.map((d) => ({ label: d.name, value: d._id })),
  ];

  const columns = [
    {
      header: 'Employee ID',
      accessor: 'employee',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md text-xs border border-slate-200">
          {row.employee?.employeeId || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Employee Name',
      accessor: 'employeeName',
      render: (row) => (
        <span className="font-semibold text-slate-800">
          {row.employee?.fullName || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => (
        <span className="text-slate-600 font-medium">
          {row.employee?.department?.name || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => formatDateDisplay(row.date),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} type="attendance" />,
    },
    {
      header: 'Remarks',
      accessor: 'remarks',
      render: (row) => (
        <span className="text-xs text-slate-500 italic max-w-xs truncate block">
          {row.remarks || '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEditModal(row)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Attendance"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingAttendance(row)}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const summaryColumns = [
    {
      header: 'Employee ID',
      accessor: 'employeeId',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md text-xs border border-slate-200">
          {row.employeeId}
        </span>
      ),
    },
    {
      header: 'Employee Name',
      accessor: 'employeeName',
      render: (row) => <span className="font-semibold text-slate-800">{row.employeeName}</span>,
    },
    {
      header: 'Department',
      accessor: 'departmentName',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
          {row.departmentName}
        </span>
      ),
    },
    {
      header: 'Total Days',
      accessor: 'totalDays',
      render: (row) => <span className="font-bold text-slate-700">{row.totalDays}</span>,
    },
    {
      header: 'Present',
      accessor: 'presentDays',
      render: (row) => <span className="font-bold text-emerald-600">{row.presentDays}</span>,
    },
    {
      header: 'Absent',
      accessor: 'absentDays',
      render: (row) => <span className="font-bold text-rose-600">{row.absentDays}</span>,
    },
    {
      header: 'Late',
      accessor: 'lateDays',
      render: (row) => <span className="font-bold text-amber-600">{row.lateDays}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Track daily attendance, statistics, and monthly summaries.</p>
        </div>

        <button
          onClick={handleOpenMarkModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30"
        >
          <Plus className="w-4 h-4" />
          Mark Attendance
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Active Employees"
          value={stats.totalEmployees}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Absent Today"
          value={stats.absentToday}
          icon={XCircle}
          color="rose"
        />
        <StatCard
          title="Late Today"
          value={stats.lateToday}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* View Switcher Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('daily')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'daily'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Daily Attendance Records
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'summary'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Attendance Summary & Charts
        </button>
      </div>

      {/* Tab 1: Daily Attendance */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Filter by exact date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Exact Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    if (e.target.value) {
                      setStartDate('');
                      setEndDate('');
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Filter by Employee */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Employee</label>
                <FilterDropdown
                  value={selectedEmployee}
                  onChange={setSelectedEmployee}
                  options={employeeOptions}
                  label="Employee"
                  icon={Users}
                />
              </div>

              {/* Filter by Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                <FilterDropdown
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={statusOptions}
                  label="Status"
                  icon={Filter}
                />
              </div>

              {/* Date Range Start & End */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value) setSelectedDate('');
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (e.target.value) setSelectedDate('');
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>

            {(selectedDate || selectedEmployee !== 'all' || selectedStatus !== 'all' || startDate || endDate) && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedDate('');
                    setSelectedEmployee('all');
                    setSelectedStatus('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <LoadingSpinner message="Loading attendance records..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchAttendance} />
          ) : attendance.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No attendance records found"
              description="No attendance records match your current filter parameters."
              actionButton={
                <button
                  onClick={handleOpenMarkModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" /> Mark Attendance
                </button>
              }
            />
          ) : (
            <DataTable columns={columns} data={attendance} keyField="_id" />
          )}
        </div>
      )}

      {/* Tab 2: Attendance Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Summary Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                value={summaryStartDate}
                onChange={(e) => setSummaryStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                value={summaryEndDate}
                onChange={(e) => setSummaryEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Department</label>
              <FilterDropdown
                value={summaryDept}
                onChange={setSummaryDept}
                options={deptOptions}
                label="Department"
              />
            </div>
          </div>

          {/* Recharts Chart Visualization */}
          {summaryData.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-4">
                Attendance Distribution by Employee
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summaryData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="employeeName"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="presentDays" name="Present Days" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absentDays" name="Absent Days" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lateDays" name="Late Days" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Summary Table */}
          {isSummaryLoading ? (
            <LoadingSpinner message="Calculating summary metrics..." />
          ) : summaryData.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No summary data available"
              description="No attendance records exist within the selected date range."
            />
          ) : (
            <DataTable columns={summaryColumns} data={summaryData} keyField="employeeId" />
          )}
        </div>
      )}

      {/* Mark / Edit Attendance Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingAttendance ? 'Edit Attendance Record' : 'Mark Employee Attendance'}
        maxWidth="max-w-lg"
      >
        <AttendanceForm
          initialData={editingAttendance}
          activeEmployees={employees}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormModalOpen(false)}
          isLoading={isFormSubmitting}
          serverError={formServerError}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingAttendance}
        onClose={() => setDeletingAttendance(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Attendance Record"
        message={`Are you sure you want to delete attendance record for ${deletingAttendance?.employee?.fullName} on ${formatDateDisplay(
          deletingAttendance?.date
        )}?`}
        confirmText="Delete Record"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AttendancePage;
