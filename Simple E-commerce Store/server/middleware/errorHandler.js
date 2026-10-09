/**
 * Centralized Error Handling Middleware
 * Catches all errors and returns user-friendly messages.
 * Never exposes database credentials, stack traces, or internal details.
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => e.message);
    message = errors.join(', ');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Send the error response
  res.status(statusCode).json({
    success: false,
    message: message
  });
};

module.exports = errorHandler;
