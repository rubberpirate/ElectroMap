const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { uploadBufferToCloudinary } = require('../config/cloudinary');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { registerSchema, loginSchema } = require('../utils/validationSchemas');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeUser = (userDoc) => {
  if (!userDoc) {
    return null;
  }

  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  return user;
};

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const register = async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);

    const existingUser = await User.findOne({
      $or: [{ email: payload.email.toLowerCase() }, { username: payload.username }],
    });

    if (existingUser) {
      return errorResponse(res, 'Email or username already exists', 409);
    }

    const createdUser = await User.create({
      username: payload.username,
      email: payload.email.toLowerCase(),
      password: payload.password,
    });

    const token = generateToken(createdUser._id);
    return successResponse(
      res,
      { user: sanitizeUser(createdUser), token },
      'Registration successful',
      201,
    );
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);

    const user = await User.findOne({ email: payload.email.toLowerCase() }).select('+password');

    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const validPassword = await user.comparePassword(payload.password);
    if (!validPassword) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const token = generateToken(user._id);
    return successResponse(res, { user: sanitizeUser(user), token }, 'Login successful');
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res) => {
  return successResponse(
    res,
    null,
    'Logged out successfully. Clear token on the client side.',
  );
};

const getMe = async (req, res) => {
  return successResponse(res, { user: sanitizeUser(req.user) }, 'Authenticated user fetched');
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    let hasChanges = false;

    if (typeof req.body.username === 'string' && req.body.username.trim()) {
      const username = req.body.username.trim();

      if (username.length < 3 || username.length > 20) {
        return errorResponse(res, 'Username must be between 3 and 20 characters', 400);
      }

      const duplicate = await User.findOne({
        username,
        _id: { $ne: req.user._id },
      });

      if (duplicate) {
        return errorResponse(res, 'Username is already in use', 409);
      }

      if (username !== user.username) {
        user.username = username;
        hasChanges = true;
      }
    }

    if (typeof req.body.email === 'string' && req.body.email.trim()) {
      const email = req.body.email.trim().toLowerCase();

      if (!emailPattern.test(email)) {
        return errorResponse(res, 'Please provide a valid email address', 400);
      }

      const duplicate = await User.findOne({
        email,
        _id: { $ne: user._id },
      });

      if (duplicate) {
        return errorResponse(res, 'Email is already in use', 409);
      }

      if (email !== user.email) {
        user.email = email;
        hasChanges = true;
      }
    }

    const currentPassword =
      typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    const confirmPassword =
      typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';

    const wantsPasswordUpdate = Boolean(currentPassword || newPassword || confirmPassword);

    if (wantsPasswordUpdate) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return errorResponse(
          res,
          'Current password, new password, and confirm password are required',
          400,
        );
      }

      if (newPassword !== confirmPassword) {
        return errorResponse(res, 'New password and confirm password must match', 400);
      }

      if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
        return errorResponse(
          res,
          'New password must be 8+ characters and include an uppercase letter and number',
          400,
        );
      }

      const validCurrentPassword = await user.comparePassword(currentPassword);
      if (!validCurrentPassword) {
        return errorResponse(res, 'Current password is incorrect', 401);
      }

      user.password = newPassword;
      hasChanges = true;
    }

    if (req.file?.buffer) {
      const avatarUrl = await uploadBufferToCloudinary(req.file.buffer, 'electromap/avatars');
      if (avatarUrl) {
        user.avatar = avatarUrl;
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      return successResponse(res, { user: sanitizeUser(user) }, 'No profile changes provided');
    }

    await user.save();

    return successResponse(res, { user: sanitizeUser(user) }, 'Profile updated successfully');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
};
