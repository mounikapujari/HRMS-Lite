import React, { useState, useEffect, useCallback } from 'react';
import { departmentAPI } from '../services/api';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DepartmentForm from '../components/DepartmentForm';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { Plus, Edit2, Trash2, Building2, Users } from 'lucide-react';

const DepartmentsPage = ({ addToast }) => {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [formServerError, setFormServerError] = useState('');

  // Delete modal state
  const [deletingDepartment, setDeletingDepartment] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const res = await departmentAPI.getAll(params);
      setDepartments(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load departments.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleOpenAddModal = () => {
    setEditingDepartment(null);
    setFormServerError('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (dept) => {
    setEditingDepartment(dept);
    setFormServerError('');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setIsFormSubmitting(true);
    setFormServerError('');
    try {
      if (editingDepartment) {
        await departmentAPI.update(editingDepartment._id, formData);
        addToast('Department updated successfully!', 'success');
      } else {
        await departmentAPI.create(formData);
        addToast('Department created successfully!', 'success');
      }
      setIsFormModalOpen(false);
      fetchDepartments();
    } catch (err) {
      setFormServerError(err.message || 'Failed to save department.');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDepartment) return;
    setIsDeleting(true);
    try {
      await departmentAPI.delete(deletingDepartment._id);
      addToast('Department deleted successfully!', 'success');
      setDeletingDepartment(null);
      fetchDepartments();
    } catch (err) {
      addToast(err.message || 'Failed to delete department.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Department Name',
      accessor: 'name',
      render: (row) => (
        <span className="font-bold text-slate-800 text-base">{row.name}</span>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => (
        <span className="text-slate-600 text-sm">{row.description || '—'}</span>
      ),
    },
    {
      header: 'Assigned Employees',
      accessor: 'employeeCount',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-100">
          <Users className="w-3.5 h-3.5 text-blue-500" />
          {row.employeeCount || 0} Employees
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
            title="Edit Department"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingDepartment(row)}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Department"
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Departments</h1>
          <p className="text-sm text-slate-500 mt-1">Manage organization departments and track employee counts.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search department by name..."
        />
      </div>

      {/* Data Table */}
      {isLoading ? (
        <LoadingSpinner message="Loading departments..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchDepartments} />
      ) : departments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments found"
          description="Start by adding departments to categorize organization employees."
          actionButton={
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Add Department
            </button>
          }
        />
      ) : (
        <DataTable columns={columns} data={departments} keyField="_id" />
      )}

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingDepartment ? 'Edit Department' : 'Add New Department'}
        maxWidth="max-w-md"
      >
        <DepartmentForm
          initialData={editingDepartment}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormModalOpen(false)}
          isLoading={isFormSubmitting}
          serverError={formServerError}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingDepartment}
        onClose={() => setDeletingDepartment(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message={`Are you sure you want to delete '${deletingDepartment?.name}'? Note: Departments with active assigned employees cannot be deleted.`}
        confirmText="Delete Department"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DepartmentsPage;
