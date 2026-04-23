const User = require('../models/User');
const Review = require('../models/Review');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit || '10', 10)));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const getSavedStations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedStations',
        select:
          'stationName address city state country rating totalReviews totalChargers availableChargers images location',
      })
      .select('savedStations')
      .lean();

    return successResponse(res, {
      stations: user?.savedStations || [],
    });
  } catch (error) {
    return next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username avatar role createdAt savedStations')
      .lean();

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, {
      profile: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
        savedStationsCount: user.savedStations?.length || 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getMyReviews = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [total, reviews] = await Promise.all([
      Review.countDocuments({ userId: req.user._id }),
      Review.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('stationId', 'stationName city state country address images rating availableChargers totalChargers location')
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

module.exports = {
  getSavedStations,
  getUserProfile,
  getMyReviews,
};
