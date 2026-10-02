const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/apiError');

// Helper to format date to YYYY-MM-DD string
const formatDateString = (date) => {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to parse date string YYYY-MM-DD into start of day UTC Date
const parseUTCStartOfDay = (dateStr) => {
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

// @desc    Get all attendance records with optional filtering
// @route   GET /api/attendance
// @access  Public
exports.getAttendance = asyncHandler(async (req, res) => {
  const { date, employee, status, startDate, endDate } = req.query;

  const query = {};

  if (date) {
    const targetDate = new Date(date);
    const startOfDay = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
    const endOfDay = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999));
    query.date = { $gte: startOfDay, $lte: endOfDay };
  } else if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      const sDate = new Date(startDate);
      query.date.$gte = new Date(Date.UTC(sDate.getFullYear(), sDate.getMonth(), sDate.getDate()));
    }
    if (endDate) {
      const eDate = new Date(endDate);
      query.date.$lte = new Date(Date.UTC(eDate.getFullYear(), eDate.getMonth(), eDate.getDate(), 23, 59, 59, 999));
    }
  }

  if (employee) {
    query.employee = employee;
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  const attendanceRecords = await Attendance.find(query)
    .populate({
      path: 'employee',
      select: 'employeeId fullName department isActive',
      populate: {
        path: 'department',
        select: 'name'
      }
    })
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    count: attendanceRecords.length,
    data: attendanceRecords
  });
});

// @desc    Get today's attendance records
// @route   GET /api/attendance/today
// @access  Public
exports.getTodayAttendance = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const endOfToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));

  const attendanceRecords = await Attendance.find({
    date: { $gte: startOfToday, $lte: endOfToday }
  }).populate({
    path: 'employee',
    select: 'employeeId fullName department',
    populate: {
      path: 'department',
      select: 'name'
    }
  });

  res.status(200).json({
    success: true,
    count: attendanceRecords.length,
    data: attendanceRecords
  });
});

// @desc    Get attendance records for a specific employee
// @route   GET /api/attendance/employee/:employeeId
// @access  Public
exports.getEmployeeAttendance = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  // Find employee by employeeId string or _id
  let employeeObj = null;
  if (employeeId.match(/^[0-9a-fA-F]{24}$/)) {
    employeeObj = await Employee.findById(employeeId);
  }
  if (!employeeObj) {
    employeeObj = await Employee.findOne({ employeeId: employeeId.toUpperCase() });
  }

  if (!employeeObj) {
    throw new ApiError(404, 'Employee not found');
  }

  const attendanceRecords = await Attendance.find({ employee: employeeObj._id })
    .populate({
      path: 'employee',
      select: 'employeeId fullName department',
      populate: {
        path: 'department',
        select: 'name'
      }
    })
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    count: attendanceRecords.length,
    employee: {
      _id: employeeObj._id,
      employeeId: employeeObj.employeeId,
      fullName: employeeObj.fullName
    },
    data: attendanceRecords
  });
});

// @desc    Get attendance stats (today or specified date)
// @route   GET /api/attendance/stats
// @access  Public
exports.getAttendanceStats = asyncHandler(async (req, res) => {
  const today = req.query.date ? new Date(req.query.date) : new Date();
  const dateStr = formatDateString(today);

  const startOfToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const endOfToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));

  const totalEmployees = await Employee.countDocuments({ isActive: true });

  const todayRecords = await Attendance.find({
    date: { $gte: startOfToday, $lte: endOfToday }
  });

  let presentToday = 0;
  let absentToday = 0;
  let lateToday = 0;

  todayRecords.forEach((record) => {
    if (record.status === 'Present') presentToday++;
    else if (record.status === 'Absent') absentToday++;
    else if (record.status === 'Late') lateToday++;
  });

  res.status(200).json({
    success: true,
    totalEmployees,
    presentToday,
    absentToday,
    lateToday,
    date: dateStr
  });
});

// @desc    Get employee attendance summary for date range & department
// @route   GET /api/attendance/summary
// @access  Public
exports.getAttendanceSummary = asyncHandler(async (req, res) => {
  let { startDate, endDate, department } = req.query;

  const now = new Date();
  if (!startDate) {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate = formatDateString(firstDay);
  }
  if (!endDate) {
    endDate = formatDateString(now);
  }

  const sDate = new Date(startDate);
  const eDate = new Date(endDate);
  const startOfDay = new Date(Date.UTC(sDate.getFullYear(), sDate.getMonth(), sDate.getDate()));
  const endOfDay = new Date(Date.UTC(eDate.getFullYear(), eDate.getMonth(), eDate.getDate(), 23, 59, 59, 999));

  // Build employee match query
  const employeeQuery = { isActive: true };
  if (department && department !== 'all') {
    employeeQuery.department = department;
  }

  const activeEmployees = await Employee.find(employeeQuery).populate('department', 'name');

  // Fetch all attendance in the date range for these employees
  const employeeIds = activeEmployees.map((e) => e._id);
  const attendanceRecords = await Attendance.find({
    employee: { $in: employeeIds },
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  // Map employee stats
  const summary = activeEmployees.map((emp) => {
    const empRecords = attendanceRecords.filter(
      (rec) => rec.employee.toString() === emp._id.toString()
    );

    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;

    empRecords.forEach((rec) => {
      if (rec.status === 'Present') presentDays++;
      else if (rec.status === 'Absent') absentDays++;
      else if (rec.status === 'Late') lateDays++;
    });

    const totalDays = presentDays + absentDays + lateDays;

    return {
      employeeId: emp.employeeId,
      employeeName: emp.fullName,
      departmentName: emp.department ? emp.department.name : 'N/A',
      totalDays,
      presentDays,
      absentDays,
      lateDays
    };
  });

  res.status(200).json({
    success: true,
    startDate,
    endDate,
    count: summary.length,
    data: summary
  });
});

// @desc    Get single attendance record by ID
// @route   GET /api/attendance/:id
// @access  Public
exports.getAttendanceById = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id).populate({
    path: 'employee',
    select: 'employeeId fullName department',
    populate: {
      path: 'department',
      select: 'name'
    }
  });

  if (!attendance) {
    throw new ApiError(404, 'Attendance record not found');
  }

  res.status(200).json({
    success: true,
    data: attendance
  });
});

// @desc    Create/Mark new attendance record
// @route   POST /api/attendance
// @access  Public
exports.createAttendance = asyncHandler(async (req, res) => {
  const { employee, date, status, remarks } = req.body;

  if (!employee || !date || !status) {
    throw new ApiError(400, 'Employee, date, and status are required fields');
  }

  // Check if employee exists and is active
  const emp = await Employee.findById(employee);
  if (!emp) {
    throw new ApiError(404, 'Employee not found');
  }
  if (!emp.isActive) {
    throw new ApiError(400, 'Cannot mark attendance for inactive employee.');
  }

  // Validate future date
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (inputDate > today) {
    throw new ApiError(400, 'Attendance date cannot be in the future.');
  }

  // Normalize date to UTC start of day
  const normalizedDate = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate()));

  // Check duplicate attendance record for employee + date
  const existingRecord = await Attendance.findOne({
    employee: emp._id,
    date: normalizedDate
  });
  if (existingRecord) {
    throw new ApiError(400, 'Attendance already marked for this employee on this date.');
  }

  const attendance = await Attendance.create({
    employee: emp._id,
    date: normalizedDate,
    status,
    remarks: remarks ? remarks.trim() : ''
  });

  const populated = await Attendance.findById(attendance._id).populate({
    path: 'employee',
    select: 'employeeId fullName department',
    populate: {
      path: 'department',
      select: 'name'
    }
  });

  res.status(201).json({
    success: true,
    data: populated
  });
});

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Public
exports.updateAttendance = asyncHandler(async (req, res) => {
  const { status, remarks, date } = req.body;

  let attendance = await Attendance.findById(req.params.id);
  if (!attendance) {
    throw new ApiError(404, 'Attendance record not found');
  }

  if (date) {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (inputDate > today) {
      throw new ApiError(400, 'Attendance date cannot be in the future.');
    }
    const normalizedDate = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate()));
    
    // Check if another record exists for same employee & date
    const existingRecord = await Attendance.findOne({
      employee: attendance.employee,
      date: normalizedDate,
      _id: { $ne: attendance._id }
    });
    if (existingRecord) {
      throw new ApiError(400, 'Attendance already marked for this employee on this date.');
    }

    attendance.date = normalizedDate;
  }

  if (status) {
    attendance.status = status;
  }
  if (remarks !== undefined) {
    attendance.remarks = remarks.trim();
  }

  await attendance.save();

  const updated = await Attendance.findById(attendance._id).populate({
    path: 'employee',
    select: 'employeeId fullName department',
    populate: {
      path: 'department',
      select: 'name'
    }
  });

  res.status(200).json({
    success: true,
    data: updated
  });
});

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Public
exports.deleteAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) {
    throw new ApiError(404, 'Attendance record not found');
  }

  await attendance.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Attendance record deleted successfully'
  });
});
