const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
};

const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }

  return jwt.verify(token, process.env.JWT_SECRET);
};

const attachUserFromToken = async (token) => {
  const decoded = verifyToken(token);
  const userId = decoded.userId || decoded.id;

  if (!userId) {
    throw new Error('Invalid token payload');
  }

  const user = await User.findById(userId).select('-password');
  return user;
};

const protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return errorResponse(res, 'Authorization token required', 401);
    }

    const user = await attachUserFromToken(token);
    if (!user) {
      return errorResponse(res, 'User not found or token invalid', 401);
    }

    req.user = user;
    return next();
  } catch (error) {
    return errorResponse(res, 'Unauthorized access', 401, error.message);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return next();
    }

    const user = await attachUserFromToken(token);
    if (user) {
      req.user = user;
    }

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
