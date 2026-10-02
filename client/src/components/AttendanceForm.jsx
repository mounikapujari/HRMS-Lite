import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { formatDateInput, getTodayString } from '../utils/formatDate';

const AttendanceForm = ({
  initialData = null,
  activeEmployees = [],
  onSubmit,
  onCancel,
  isLoading = false,
  serverError = '',
}) => {
  const [formData, setFormData] = useState({
    employee: '',
    date: getTodayString(),
    status: 'Present',
    remarks: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        employee: initialData.employee?._id || initialData.employee || '',
        date: formatDateInput(initialData.date) || getTodayString(),
        status: initialData.status || 'Present',
        remarks: initialData.remarks || '',
      });
    } else {
      setFormData({
        employee: activeEmployees.length > 0 ? activeEmployees[0]._id : '',
        date: getTodayString(),
        status: 'Present',
        remarks: '',
      });
    }
  }, [initialData, activeEmployees]);

  const validate = () => {
    const newErrors = {};

    if (!formData.employee) {
      newErrors.employee = 'Employee is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selected = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selected > today) {
        newErrors.date = 'Attendance date cannot be in the future';
      }
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    if (formData.remarks && formData.remarks.length > 500) {
      newErrors.remarks = 'Remarks cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          {serverError}
        </div>
      )}

      {/* Employee Selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          Employee <span className="text-rose-500">*</span>
        </label>
        <select
          name="employee"
          value={formData.employee}
          onChange={handleChange}
          disabled={!!initialData} // Lock employee field when editing single attendance record
          className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500 ${
            errors.employee
              ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500'
              : 'border-slate-200 focus:ring-blue-200 focus:border-blue-500'
          }`}
        >
          <option value="">Select Employee</option>
          {activeEmployees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.employeeId} - {emp.fullName} ({emp.department?.name || 'No Dept'})
            </option>
          ))}
        </select>
        {errors.employee && (
          <p className="text-xs text-rose-600 mt-1">{errors.employee}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 ${
              errors.date
                ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500'
                : 'border-slate-200 focus:ring-blue-200 focus:border-blue-500'
            }`}
          />
          {errors.date && (
            <p className="text-xs text-rose-600 mt-1">{errors.date}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Status <span className="text-rose-500">*</span>
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
          </select>
        </div>
      </div>

      {/* Remarks */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          Remarks (Optional)
        </label>
        <textarea
          name="remarks"
          rows="3"
          value={formData.remarks}
          onChange={handleChange}
          placeholder="e.g. On-time, Traffic delay, Approved leave"
          className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
        />
        {errors.remarks && (
          <p className="text-xs text-rose-600 mt-1">{errors.remarks}</p>
        )}
      </div>

      {/* Form Action Buttons */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200 disabled:opacity-50"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {initialData ? 'Update Record' : 'Mark Attendance'}
        </button>
      </div>
    </form>
  );
};

export default AttendanceForm;
