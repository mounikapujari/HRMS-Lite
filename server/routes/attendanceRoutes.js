const express = require('express');
const router = express.Router();
const {
  getAttendance,
  getTodayAttendance,
  getEmployeeAttendance,
  getAttendanceStats,
  getAttendanceSummary,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance
} = require('../controllers/attendanceController');

router.route('/')
  .get(getAttendance)
  .post(createAttendance);

router.get('/today', getTodayAttendance);
router.get('/stats', getAttendanceStats);
router.get('/summary', getAttendanceSummary);
router.get('/employee/:employeeId', getEmployeeAttendance);

router.route('/:id')
  .get(getAttendanceById)
  .put(updateAttendance)
  .delete(deleteAttendance);

module.exports = router;
