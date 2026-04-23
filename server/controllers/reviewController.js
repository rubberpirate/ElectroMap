const Review = require('../models/Review');
const Station = require('../models/Station');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { reviewSchema } = require('../utils/validationSchemas');

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit || '20', 10)));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const getReviewsByStation = async (req, res, next) => {
  try {
    const stationId = req.params.stationId;
    const sortBy = (req.query.sortBy || 'newest').toLowerCase();
    const { page, limit, skip } = parsePagination(req.query);

    const sort =
      sortBy === 'top-rated'
        ? { rating: -1, createdAt: -1 }
        : {
            createdAt: -1,
          };

    const [total, reviews] = await Promise.all([
      Review.countDocuments({ stationId }),
      Review.find({ stationId })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username avatar')
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

const createReview = async (req, res, next) => {
  try {
    const stationId = req.params.stationId;
    const payload = reviewSchema.parse(req.body);

    const station = await Station.findById(stationId).select('_id');
    if (!station) {
      return errorResponse(res, 'Station not found', 404);
    }

    const existingReview = await Review.findOne({
      stationId,
      userId: req.user._id,
    }).select('_id');

    if (existingReview) {
      return errorResponse(res, 'You have already reviewed this station', 409);
    }

    const review = await Review.create({
      stationId,
      userId: req.user._id,
      rating: payload.rating,
      comment: payload.comment,
      tags: payload.tags || [],
    });

    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'username avatar')
      .lean();

    return successResponse(res, { review: populatedReview }, 'Review created', 201);
  } catch (error) {
    return next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return errorResponse(res, 'Review not found', 404);
    }

    const isOwner = String(review.userId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'You can only edit your own review', 403);
    }

    const payload = reviewSchema.partial().parse(req.body);

    if (payload.rating !== undefined) {
      review.rating = payload.rating;
    }

    if (payload.comment !== undefined) {
      review.comment = payload.comment;
    }

    if (payload.tags !== undefined) {
      review.tags = payload.tags;
    }

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'username avatar')
      .lean();

    return successResponse(res, { review: populatedReview }, 'Review updated');
  } catch (error) {
    return next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return errorResponse(res, 'Review not found', 404);
    }

    const isOwner = String(review.userId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'You can only delete your own review', 403);
    }

    await review.deleteOne();

    return successResponse(res, null, 'Review deleted');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getReviewsByStation,
  createReview,
  updateReview,
  deleteReview,
};
