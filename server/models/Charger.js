const mongoose = require('mongoose');

const chargerSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Station',
      required: true,
      index: true,
    },
    chargerType: {
      type: String,
      enum: ['Level1', 'Level2', 'DC_Fast', 'Tesla_Supercharger'],
      required: true,
    },
    powerOutput: {
      type: Number,
      min: 0,
      default: 0,
    },
    connectorType: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'offline', 'maintenance'],
      default: 'available',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

chargerSchema.pre('save', function stampLastUpdated(next) {
  this.lastUpdated = new Date();
  next();
});

const Charger = mongoose.model('Charger', chargerSchema);

module.exports = Charger;
