const Department = require('../models/Department');
const Employee = require('../models/Employee');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/apiError');

// @desc    Get all departments (with search & employee count)
// @route   GET /api/departments
// @access  Public
exports.getDepartments = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const matchStage = {};
  if (search) {
    matchStage.name = { $regex: search.trim(), $options: 'i' };
  }

  const departments = await Department.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'employees',
        localField: '_id',
        foreignField: 'department',
        as: 'employees'
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        employeeCount: { $size: '$employees' }
      }
    },
    { $sort: { name: 1 } }
  ]);

  res.status(200).json({
    success: true,
    count: departments.length,
    data: departments
  });
});

// @desc    Get single department by ID
// @route   GET /api/departments/:id
// @access  Public
exports.getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  const employeeCount = await Employee.countDocuments({ department: req.params.id });

  res.status(200).json({
    success: true,
    data: {
      ...department.toObject(),
      employeeCount
    }
  });
});

// @desc    Create new department
// @route   POST /api/departments
// @access  Public
exports.createDepartment = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Department name is required');
  }

  const existingDept = await Department.findOne({
    name: { $regex: `^${name.trim()}$`, $options: 'i' }
  });

  if (existingDept) {
    throw new ApiError(400, 'Department name already exists');
  }

  const department = await Department.create({
    name: name.trim(),
    description: description ? description.trim() : ''
  });

  res.status(201).json({
    success: true,
    data: {
      ...department.toObject(),
      employeeCount: 0
    }
  });
});

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Public
exports.updateDepartment = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  let department = await Department.findById(req.params.id);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  if (name && name.trim().toLowerCase() !== department.name.toLowerCase()) {
    const existingDept = await Department.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      _id: { $ne: req.params.id }
    });
    if (existingDept) {
      throw new ApiError(400, 'Department name already exists');
    }
  }

  department.name = name !== undefined ? name.trim() : department.name;
  department.description = description !== undefined ? description.trim() : department.description;

  await department.save();

  const employeeCount = await Employee.countDocuments({ department: department._id });

  res.status(200).json({
    success: true,
    data: {
      ...department.toObject(),
      employeeCount
    }
  });
});

// @desc    Delete department safely
// @route   DELETE /api/departments/:id
// @access  Public
exports.deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  // Check if any employees are associated with this department
  const employeeCount = await Employee.countDocuments({ department: req.params.id });
  if (employeeCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete department '${department.name}' because it has ${employeeCount} active employee(s). Please reassign or delete them first.`
    );
  }

  await department.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Department deleted successfully'
  });
});
