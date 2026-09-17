const { verifyToken } = require('../utils/generateToken');
const { errorResponse } = require('../utils/apiResponse');

// Role hierarchy: role_id -> role name mapping (matches DB roles table)
const ROLE_IDS = {
  1: 'Super Admin',
  2: 'Admin',
  3: 'Teams',
  4: 'Clients',
};

/**
 * Middleware to authenticate requests using JWT.
 * Rejects requests with no or invalid token.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Authentication required. Please log in.');
    }

    const tokenStr = authHeader.split(' ')[1];

    // Reject mock/demo tokens in all environments
    if (!tokenStr || tokenStr === 'mock_token' || tokenStr === 'demo_token' || tokenStr.startsWith('mock_')) {
      return errorResponse(res, 401, 'Invalid token. Please log in again.');
    }

    const decoded = verifyToken(tokenStr);
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 401, 'Session expired or invalid. Please log in again.');
  }
};

/**
 * Middleware factory to restrict access by role.
 * @param {...number} allowedRoleIds - Role IDs that are permitted
 * Example: requireRole(1, 2) — only Super Admin and Admin
 */
const requireRole = (...allowedRoleIds) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required.');
    }
    const userRoleId = Number(req.user.role_id);
    const userRole = String(req.user.role || req.user.role_name || ROLE_IDS[userRoleId] || '').toLowerCase();
    
    // Super admin role always passes super admin / role checks unless specifically restricted
    if (userRoleId === 1 || userRole.includes('super')) {
      return next();
    }

    const numericAllowed = allowedRoleIds.map(Number);
    if (!numericAllowed.includes(userRoleId)) {
      const roleName = ROLE_IDS[userRoleId] || req.user.role || 'Unknown';
      return errorResponse(res, 403, `Access denied. Your role (${roleName}) does not have permission for this action.`);
    }
    next();
  };
};

/**
 * Soft auth — attach user if token present, but don't block if missing.
 * Use for public-read endpoints.
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const tokenStr = authHeader.split(' ')[1];
      if (tokenStr && !tokenStr.startsWith('mock_')) {
        req.user = verifyToken(tokenStr);
      }
    }
  } catch {}
  next();
};

module.exports = { authenticate, requireRole, optionalAuth };