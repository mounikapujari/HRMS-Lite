const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/apiError');

// @desc    Get all employees with combined search and filter
// @route   GET /api/employees
// @access  Public
exports.getEmployees = asyncHandler(async (req, res) => {
  const { search, department, isActive } = req.query;

  const query = {};

  // Search filter (employeeId, fullName, email)
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { employeeId: searchRegex },
      { fullName: searchRegex },
      { email: searchRegex }
    ];
  }

  // Department filter
  if (department && department !== 'all') {
    query.department = department;
  }

  // Active status filter
  if (isActive !== undefined && isActive !== 'all') {
    query.isActive = isActive === 'true' || isActive === true;
  }

  const employees = await Employee.find(query)
    .populate('department', 'name description')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: employees.length,
    data: employees
  });
});

// @desc    Get total active employees count
// @route   GET /api/employees/count
// @access  Public
exports.getEmployeeCount = asyncHandler(async (req, res) => {
  const totalEmployees = await Employee.countDocuments({ isActive: true });

  res.status(200).json({
    success: true,
    totalEmployees
  });
});

// @desc    Get single employee by ID
// @route   GET /api/employees/:id
// @access  Public
exports.getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id).populate('department', 'name description');
  
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  res.status(200).json({
    success: true,
    data: employee
  });
});

// @desc    Create new employee
// @route   POST /api/employees
// @access  Public
exports.createEmployee = asyncHandler(async (req, res) => {
  const {
    employeeId,
    fullName,
    email,
    department,
    designation,
    gender,
    phone,
    address,
    hireDate,
    isActive
  } = req.body;

  // Check department existence
  const deptExists = await Department.findById(department);
  if (!deptExists) {
    throw new ApiError(400, 'Invalid department provided');
  }

  // Check employeeId unique
  const formattedEmployeeId = employeeId ? employeeId.trim().toUpperCase() : '';
  const existingId = await Employee.findOne({ employeeId: formattedEmployeeId });
  if (existingId) {
    throw new ApiError(400, 'Employee ID already exists.');
  }

  // Check email unique
  const formattedEmail = email ? email.trim().toLowerCase() : '';
  const existingEmail = await Employee.findOne({ email: formattedEmail });
  if (existingEmail) {
    throw new ApiError(400, 'Email already exists.');
  }

  // Validate hireDate
  if (hireDate) {
    const dateObj = new Date(hireDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (dateObj > today) {
      throw new ApiError(400, 'Hire date cannot be in the future.');
    }
  }

  const employee = await Employee.create({
    employeeId: formattedEmployeeId,
    fullName,
    email: formattedEmail,
    department,
    designation,
    gender,
    phone,
    address,
    hireDate,
    isActive: isActive !== undefined ? isActive : true
  });

  const populatedEmployee = await Employee.findById(employee._id).populate('department', 'name description');

  res.status(201).json({
    success: true,
    data: populatedEmployee
  });
});

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Public
exports.updateEmployee = asyncHandler(async (req, res) => {
  let employee = await Employee.findById(req.params.id);
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  const {
    employeeId,
    fullName,
    email,
    department,
    designation,
    gender,
    phone,
    address,
    hireDate,
    isActive
  } = req.body;

  if (department) {
    const deptExists = await Department.findById(department);
    if (!deptExists) {
      throw new ApiError(400, 'Invalid department provided');
    }
  }

  if (employeeId && employeeId.trim().toUpperCase() !== employee.employeeId) {
    const existingId = await Employee.findOne({
      employeeId: employeeId.trim().toUpperCase(),
      _id: { $ne: req.params.id }
    });
    if (existingId) {
      throw new ApiError(400, 'Employee ID already exists.');
    }
  }

  if (email && email.trim().toLowerCase() !== employee.email) {
    const existingEmail = await Employee.findOne({
      email: email.trim().toLowerCase(),
      _id: { $ne: req.params.id }
    });
    if (existingEmail) {
      throw new ApiError(400, 'Email already exists.');
    }
  }

  if (hireDate) {
    const dateObj = new Date(hireDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (dateObj > today) {
      throw new ApiError(400, 'Hire date cannot be in the future.');
    }
  }

  employee.employeeId = employeeId ? employeeId.trim().toUpperCase() : employee.employeeId;
  employee.fullName = fullName !== undefined ? fullName : employee.fullName;
  employee.email = email ? email.trim().toLowerCase() : employee.email;
  employee.department = department || employee.department;
  employee.designation = designation !== undefined ? designation : employee.designation;
  employee.gender = gender || employee.gender;
  employee.phone = phone !== undefined ? phone : employee.phone;
  employee.address = address !== undefined ? address : employee.address;
  employee.hireDate = hireDate || employee.hireDate;
  employee.isActive = isActive !== undefined ? isActive : employee.isActive;

  await employee.save();

  const updatedEmployee = await Employee.findById(employee._id).populate('department', 'name description');

  res.status(200).json({
    success: true,
    data: updatedEmployee
  });
});

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Public
exports.deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  // Delete all attendance records associated with this employee
  await Attendance.deleteMany({ employee: employee._id });

  await employee.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Employee and associated attendance records deleted successfully'
  });
});
