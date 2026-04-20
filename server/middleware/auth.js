const jwt = require('jsonwebtoken');

const { errorResponse } = require('../utils/apiResponse');

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
};

const decodeToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }

  return jwt.verify(token, process.env.JWT_SECRET);
};

const protect = (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return errorResponse(res, 'Authorization token required', 401);
    }

    const decoded = decodeToken(token);
    req.user = decoded;

    return next();
  } catch (error) {
    return errorResponse(res, 'Unauthorized access', 401, error.message);
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return next();
    }

    req.user = decodeToken(token);
    return next();
  } catch (error) {
    return next();
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', 401);
  }

  if (req.user.role !== 'admin') {
    return errorResponse(res, 'Admin access required', 403);
  }

  return next();
};

module.exports = {
  protect,
  optionalAuth,
  adminOnly,
};
