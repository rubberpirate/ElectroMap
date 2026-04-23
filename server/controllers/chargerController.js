const Charger = require('../models/Charger');
const Station = require('../models/Station');
const { emitChargerUpdate } = require('../services/socketService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { chargerStatusSchema } = require('../utils/validationSchemas');

const getChargersByStation = async (req, res, next) => {
  try {
    const station = await Station.findById(req.params.stationId).select('_id');
    if (!station) {
      return errorResponse(res, 'Station not found', 404);
    }

    const chargers = await Charger.find({ stationId: station._id }).sort({ lastUpdated: -1 }).lean();
    return successResponse(res, { chargers });
  } catch (error) {
    return next(error);
  }
};

const isValidIotToken = (req) => {
  const iotToken = req.headers['x-iot-token'];
  return Boolean(process.env.IOT_SECRET_TOKEN) && iotToken === process.env.IOT_SECRET_TOKEN;
};

const updateChargerStatus = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const isIoT = isValidIotToken(req);

    if (!isAdmin && !isIoT) {
      return errorResponse(res, 'Admin auth or valid IoT token required', 403);
    }

    const payload = chargerStatusSchema.parse(req.body);

    const charger = await Charger.findById(req.params.id);
    if (!charger) {
      return errorResponse(res, 'Charger not found', 404);
    }

    charger.status = payload.status;
    charger.lastUpdated = new Date();
    await charger.save();

    const [totalChargers, availableChargers] = await Promise.all([
      Charger.countDocuments({ stationId: charger.stationId }),
      Charger.countDocuments({ stationId: charger.stationId, status: 'available' }),
    ]);

    await Station.findByIdAndUpdate(charger.stationId, {
      totalChargers,
      availableChargers,
      updatedAt: new Date(),
    });

    const payloadForSocket = {
      stationId: String(charger.stationId),
      chargerId: String(charger._id),
      status: charger.status,
      availableChargers,
    };

    emitChargerUpdate(req.app.get('io'), String(charger.stationId), payloadForSocket);

    return successResponse(res, {
      charger,
      availableChargers,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getChargersByStation,
  updateChargerStatus,
};
