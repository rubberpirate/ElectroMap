const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema(
  {
    stationName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coords) => Array.isArray(coords) && coords.length === 2,
          message: 'Location coordinates must be [lng, lat]',
        },
      },
    },
    chargerTypes: [
      {
        type: String,
        enum: ['Level1', 'Level2', 'DC_Fast', 'Tesla_Supercharger'],
      },
    ],
    totalChargers: {
      type: Number,
      min: 0,
      default: 0,
    },
    availableChargers: {
      type: Number,
      min: 0,
      default: 0,
    },
    pricing: {
      perKwh: { type: Number, min: 0, default: 0 },
      perMinute: { type: Number, min: 0, default: 0 },
      sessionFee: { type: Number, min: 0, default: 0 },
      currency: { type: String, default: 'INR', trim: true },
    },
    operatingHours: {
      is24Hours: { type: Boolean, default: false },
      open: { type: String, default: '00:00' },
      close: { type: String, default: '23:59' },
    },
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [
      {
        type: String,
      },
    ],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalReviews: {
      type: Number,
      min: 0,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

stationSchema.index({ location: '2dsphere' });
stationSchema.index({ city: 1, rating: -1 });
stationSchema.index({ stationName: 'text', address: 'text', city: 'text' });

stationSchema.pre('save', function stampUpdatedAt(next) {
  this.updatedAt = new Date();
  next();
});

const parseClock = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const [hours, minutes] = value.split(':').map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

stationSchema.virtual('isOpen').get(function getIsOpen() {
  const hours = this.operatingHours || {};

  if (hours.is24Hours) {
    return true;
  }

  const openMinutes = parseClock(hours.open);
  const closeMinutes = parseClock(hours.close);

  if (openMinutes === null || closeMinutes === null) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (openMinutes <= closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
});

const Station = mongoose.model('Station', stationSchema);

module.exports = Station;
