const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware for Role-Based Access Control (RBAC)
 * @param {...(number|string)} allowedRoles - List of allowed role IDs (e.g. 1 for Admin) or Role Names
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Unauthorized. Authentication required.');
    }

    const userRole = req.user.role_id || req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return errorResponse(res, 403, 'Forbidden. You do not have permission to access this resource.');
    }

    next();
  };
};

module.exports = authorizeRoles;