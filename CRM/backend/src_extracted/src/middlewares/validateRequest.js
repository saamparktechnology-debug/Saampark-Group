const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware to validate request payload
 * @param {Function} validatorFn - Validation logic function returning { error, value }
 */
const validateRequest = (validatorFn) => {
  return (req, res, next) => {
    const { error, value } = validatorFn(req.body);

    if (error) {
      const errorDetails = error.details 
        ? error.details.map((d) => d.message) 
        : [error.message || 'Invalid payload'];
        
      return errorResponse(res, 400, 'Validation Error', errorDetails);
    }

    // Assign sanitized value back to req.body
    req.body = value;
    next();
  };
};

module.exports = validateRequest;