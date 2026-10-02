import React, { useState, useEffect, useCallback } from 'react';
import { employeeAPI, departmentAPI } from '../services/api';
import SearchBar from '../components/SearchBar';
import FilterDropdown from '../components/FilterDropdown';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import EmployeeForm from '../components/EmployeeForm';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { formatDateDisplay } from '../utils/formatDate';
import { Plus, Edit2, Trash2, Users, Building2, UserCheck } from 'lucide-react';

const EmployeesPage = ({ addToast }) => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [formServerError, setFormServerError] = useState('');

  // Delete modal state
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stats
  const [totalCount, setTotalCount] = useState(0);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await departmentAPI.getAll();
      setDepartments(res.data || []);
    } catch (err) {
      console.error('Failed to load departments:', err.message);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedDept !== 'all') params.department = selectedDept;
      if (selectedStatus !== 'all') params.isActive = selectedStatus;

      const res = await employeeAPI.getAll(params);
      setEmployees(res.data || []);

      const countRes = await employeeAPI.getCount();
      setTotalCount(countRes.totalEmployees || 0);
    } catch (err) {
      setError(err.message || 'Failed to load employees.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedDept, selectedStatus]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Handle Add/Edit Employee
  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormServerError('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormServerError('');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsFormSubmitting(true);
    setFormServerError('');
    try {
      if (editingEmployee) {
        await employeeAPI.update(editingEmployee._id, formData);
        addToast('Employee updated successfully!', 'success');
      } else {
        await employeeAPI.create(formData);
        addToast('Employee added successfully!', 'success');
      }
      setIsFormModalOpen(false);
      fetchEmployees();
    } catch (err) {
      setFormServerError(err.message || 'Failed to save employee.');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Handle Delete Employee
  const handleDeleteConfirm = async () => {
    if (!deletingEmployee) return;
    setIsDeleting(true);
    try {
      await employeeAPI.delete(deletingEmployee._id);
      addToast('Employee deleted successfully!', 'success');
      setDeletingEmployee(null);
      fetchEmployees();
    } catch (err) {
      addToast(err.message || 'Failed to delete employee.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const deptOptions = [
    { label: 'All Departments', value: 'all' },
    ...departments.map((d) => ({ label: d.name, value: d._id })),
  ];

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Active Only', value: 'true' },
    { label: 'Inactive Only', value: 'false' },
  ];

  const columns = [
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
      header: 'Name',
      accessor: 'fullName',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.fullName}</div>
          <div className="text-xs text-slate-400 font-normal">{row.gender}</div>
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (row) => (
        <span className="text-slate-600 font-normal">{row.email}</span>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
          <Building2 className="w-3.5 h-3.5 text-blue-500" />
          {row.department?.name || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Designation',
      accessor: 'designation',
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (row) => row.phone || '—',
    },
    {
      header: 'Hire Date',
      accessor: 'hireDate',
      render: (row) => formatDateDisplay(row.hireDate),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => <StatusBadge status={row.isActive} type="active" />,
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEditModal(row)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Employee"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingEmployee(row)}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Employee"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employees</h1>
          <p className="text-sm text-slate-500 mt-1">Manage employee records, departments, and active statuses.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by Employee ID, Name, or Email..."
        />
        <div className="flex flex-wrap gap-3">
          <FilterDropdown
            value={selectedDept}
            onChange={setSelectedDept}
            options={deptOptions}
            label="Department"
            icon={Building2}
          />
          <FilterDropdown
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={statusOptions}
            label="Status"
            icon={UserCheck}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner message="Loading employee records..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchEmployees} />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description={
            searchTerm || selectedDept !== 'all' || selectedStatus !== 'all'
              ? 'No employee records match your search criteria. Try clearing filters.'
              : 'Start by adding your first employee record to the database.'
          }
          actionButton={
            searchTerm || selectedDept !== 'all' || selectedStatus !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDept('all');
                  setSelectedStatus('all');
                }}
                className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Employee
              </button>
            )
          }
        />
      ) : (
        <DataTable columns={columns} data={employees} keyField="_id" />
      )}

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingEmployee ? 'Edit Employee Record' : 'Add New Employee'}
        maxWidth="max-w-2xl"
      >
        <EmployeeForm
          initialData={editingEmployee}
          departments={departments}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormModalOpen(false)}
          isLoading={isFormSubmitting}
          serverError={formServerError}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee"
        message={`Are you sure you want to delete ${deletingEmployee?.fullName} (${deletingEmployee?.employeeId})? This will also remove all associated attendance records.`}
        confirmText="Delete Employee"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EmployeesPage;
