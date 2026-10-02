const ApiError = require('../utils/apiError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for development
  console.error('Error:', err);

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ApiError(404, message);
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const keys = Object.keys(err.keyValue || {});
    let message = 'Duplicate field value entered.';
    if (keys.includes('employeeId')) {
      message = 'Employee ID already exists.';
    } else if (keys.includes('email')) {
      message = 'Email already exists.';
    } else if (keys.includes('name')) {
      message = 'Department name already exists.';
    } else if (keys.includes('employee') && keys.includes('date')) {
      message = 'Attendance already marked for this employee on this date.';
    } else if (keys.length > 0) {
      message = `${keys.join(', ')} must be unique. Duplicate entry found.`;
    }
    error = new ApiError(400, message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join('. ');
    error = new ApiError(400, message);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
