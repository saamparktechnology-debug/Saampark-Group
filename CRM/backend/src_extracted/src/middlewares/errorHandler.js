const { errorResponse } = require('../utils/apiResponse');

/**
 * Global Express Error Handler
 */
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || null;

  return errorResponse(res, statusCode, message, errors);
};

module.exports = errorHandler;