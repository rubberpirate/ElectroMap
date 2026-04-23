const mongoose = require('mongoose');

const Charger = require('../models/Charger');
const Review = require('../models/Review');
const Station = require('../models/Station');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const ROLES = new Set(['user', 'admin']);

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit || '20', 10)));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const getMonthWindow = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const labels = [];

  for (let index = 0; index < 12; index += 1) {
    const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + index, 1);
    labels.push({
      key: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
      label: monthDate.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
      count: 0,
    });
  }

  return {
    startDate,
    labels,
  };
};

const getAdminStats = async (req, res, next) => {
  try {
    const [totalStations, totalChargers, totalUsers, totalReviews, activeStations] =
      await Promise.all([
        Station.countDocuments(),
        Charger.countDocuments(),
        User.countDocuments(),
        Review.countDocuments(),
        Station.countDocuments({ availableChargers: { $gt: 0 } }),
      ]);

    const { startDate, labels } = getMonthWindow();

    const [stationsByMonthRaw, chargerStatusRaw] = await Promise.all([
      Station.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Charger.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const monthlyMap = new Map(
      stationsByMonthRaw.map((item) => {
        const key = `${item?._id?.year}-${String(item?._id?.month || '').padStart(2, '0')}`;
        return [key, Number(item?.count) || 0];
      }),
    );

    const stationsByMonth = labels.map((entry) => ({
      month: entry.label,
      count: monthlyMap.get(entry.key) || 0,
    }));

    const chargerStatusTotals = {
      available: 0,
      occupied: 0,
      offline: 0,
      maintenance: 0,
    };

    chargerStatusRaw.forEach((item) => {
      const key = String(item?._id || '').toLowerCase();
      if (Object.hasOwn(chargerStatusTotals, key)) {
        chargerStatusTotals[key] = Number(item?.count) || 0;
      }
    });

    return successResponse(res, {
      totalStations,
      totalChargers,
      totalUsers,
      totalReviews,
      activeStations,
      stationsByMonth,
      chargerStatusBreakdown: chargerStatusTotals,
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const filters = {};
    if (query) {
      filters.$or = [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filters),
      User.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('username email role avatar createdAt savedStations')
        .lean(),
    ]);

    return successResponse(res, {
      users: users.map((user) => ({
        ...user,
        savedStationsCount: Array.isArray(user.savedStations) ? user.savedStations.length : 0,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const role = String(req.body?.role || '').trim().toLowerCase();

    if (!ROLES.has(role)) {
      return errorResponse(res, 'Role must be either "user" or "admin"', 400);
    }

    if (String(req.user?._id) === String(req.params.id) && role !== 'admin') {
      return errorResponse(res, 'You cannot remove your own admin role', 400);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true },
    )
      .select('username email role avatar createdAt savedStations')
      .lean();

    if (!updatedUser) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, {
      user: {
        ...updatedUser,
        savedStationsCount: Array.isArray(updatedUser.savedStations)
          ? updatedUser.savedStations.length
          : 0,
      },
    }, 'User role updated');
  } catch (error) {
    return next(error);
  }
};

const getAdminReviews = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [total, reviews] = await Promise.all([
      Review.countDocuments(),
      Review.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email avatar')
        .populate('stationId', 'stationName city state')
        .lean(),
    ]);

    return successResponse(res, {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminChargers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const stationId = typeof req.query.stationId === 'string' ? req.query.stationId.trim() : '';

    const filters = {};
    if (stationId) {
      if (!mongoose.Types.ObjectId.isValid(stationId)) {
        return errorResponse(res, 'Invalid station id', 400);
      }
      filters.stationId = stationId;
    }

    const [total, chargers] = await Promise.all([
      Charger.countDocuments(filters),
      Charger.find(filters)
        .sort({ lastUpdated: -1 })
        .skip(skip)
        .limit(limit)
        .populate('stationId', 'stationName city state')
        .lean(),
    ]);

    return successResponse(res, {
      chargers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  getAdminReviews,
  getAdminChargers,
};
