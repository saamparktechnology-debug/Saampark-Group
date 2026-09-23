/**
 * Standardized success response helper
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (e.g., 200, 201)
 * @param {string} message - Response message
 * @param {Object|Array|null} data - Payload data
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

/**
 * Standardized error response helper
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (e.g., 400, 401, 404, 500)
 * @param {string} message - Error message
 * @param {Object|Array|null} errors - Detailed validation errors or error details
 */
const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
    ...(errors && { errors }),
  });
};

module.exports = {
  successResponse,
  errorResponse,
};