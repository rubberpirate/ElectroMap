const mongoose = require('mongoose');

const Station = require('./Station');

const reviewSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Station',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

reviewSchema.index({ stationId: 1, userId: 1 }, { unique: true });

const recalculateStationRating = async (stationId) => {
  if (!stationId) {
    return;
  }

  const [result] = await mongoose.model('Review').aggregate([
    { $match: { stationId: new mongoose.Types.ObjectId(stationId) } },
    {
      $group: {
        _id: '$stationId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (!result) {
    await Station.findByIdAndUpdate(stationId, { rating: 0, totalReviews: 0 });
    return;
  }

  await Station.findByIdAndUpdate(stationId, {
    rating: Number(result.averageRating.toFixed(2)),
    totalReviews: result.totalReviews,
  });
};

reviewSchema.post('save', async function onSave() {
  await recalculateStationRating(this.stationId);
});

reviewSchema.post('remove', async function onRemove() {
  await recalculateStationRating(this.stationId);
});

reviewSchema.post('deleteOne', { document: true, query: false }, async function onDeleteOne() {
  await recalculateStationRating(this.stationId);
});

reviewSchema.post('findOneAndDelete', async function onFindOneAndDelete(doc) {
  if (doc) {
    await recalculateStationRating(doc.stationId);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
