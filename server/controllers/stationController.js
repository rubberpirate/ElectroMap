const mongoose = require('mongoose');

const Station = require('../models/Station');
const Charger = require('../models/Charger');
const Review = require('../models/Review');
const User = require('../models/User');
const { uploadBufferToCloudinary } = require('../config/cloudinary');
const { emitNewStation } = require('../services/socketService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { haversineDistanceKm } = require('../utils/geoUtils');
const { stationSchema } = require('../utils/validationSchemas');

const DEFAULT_RADIUS_METERS = 10000;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const parseBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return null;
};

const parseJSONOrValue = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  const likelyJson =
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'));

  if (!likelyJson) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return value;
  }
};

const normalizeArrayField = (value) => {
  const parsed = parseJSONOrValue(value);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (typeof parsed === 'string' && parsed.includes(',')) {
    return parsed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof parsed === 'string' && parsed.trim()) {
    return [parsed.trim()];
  }

  return [];
};

const normalizeStationPayload = (rawPayload) => {
  const payload = { ...rawPayload };

  payload.location = parseJSONOrValue(payload.location);
  payload.pricing = parseJSONOrValue(payload.pricing);
  payload.operatingHours = parseJSONOrValue(payload.operatingHours);
  payload.chargers = parseJSONOrValue(payload.chargers);

  payload.chargerTypes = normalizeArrayField(payload.chargerTypes);
  payload.amenities = normalizeArrayField(payload.amenities);
  payload.images = normalizeArrayField(payload.images);
  payload.existingImages = normalizeArrayField(payload.existingImages);

  if (payload.totalChargers !== undefined) {
    payload.totalChargers = Number(payload.totalChargers);
  }

  if (payload.availableChargers !== undefined) {
    payload.availableChargers = Number(payload.availableChargers);
  }

  if (payload.isVerified !== undefined) {
    payload.isVerified = parseBoolean(payload.isVerified);
  }

  if (payload.pricing && typeof payload.pricing === 'object') {
    payload.pricing = {
      ...payload.pricing,
      perKwh:
        payload.pricing.perKwh !== undefined ? Number(payload.pricing.perKwh) : payload.pricing.perKwh,
      perMinute:
        payload.pricing.perMinute !== undefined
          ? Number(payload.pricing.perMinute)
          : payload.pricing.perMinute,
      sessionFee:
        payload.pricing.sessionFee !== undefined
          ? Number(payload.pricing.sessionFee)
          : payload.pricing.sessionFee,
    };
  }

  if (Array.isArray(payload.chargers)) {
    payload.chargers = payload.chargers.map((charger) => ({
      ...charger,
      powerOutput:
        charger?.powerOutput !== undefined ? Number(charger.powerOutput) : charger?.powerOutput,
    }));
  }

  return payload;
};

const isStationOpenNow = (operatingHours) => {
  if (!operatingHours) {
    return false;
  }

  if (operatingHours.is24Hours) {
    return true;
  }

  const parseClock = (value) => {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const [hours, minutes] = value.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    return hours * 60 + minutes;
  };

  const openMinutes = parseClock(operatingHours.open);
  const closeMinutes = parseClock(operatingHours.close);

  if (openMinutes === null || closeMinutes === null) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (openMinutes <= closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
};

const parsePagination = (query) => {
  const page = Math.max(DEFAULT_PAGE, Number.parseInt(query.page || DEFAULT_PAGE, 10));
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit || DEFAULT_LIMIT, 10)));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const buildChargerDocuments = (stationId, payload) => {
  if (Array.isArray(payload.chargers) && payload.chargers.length > 0) {
    return payload.chargers.map((charger) => ({
      stationId,
      chargerType: charger.chargerType,
      powerOutput: charger.powerOutput ?? 0,
      connectorType: charger.connectorType,
      status: charger.status || 'available',
    }));
  }

  const totalChargers = payload.totalChargers || 0;
  const preferredType = payload.chargerTypes?.[0] || 'Level2';
  const availableChargers =
    payload.availableChargers === undefined ? totalChargers : payload.availableChargers;

  return Array.from({ length: totalChargers }).map((_, index) => ({
    stationId,
    chargerType: preferredType,
    powerOutput: 0,
    connectorType: 'Type2',
    status: index < availableChargers ? 'available' : 'occupied',
  }));
};

const uploadStationImages = async (files = []) => {
  const validFiles = Array.isArray(files) ? files.slice(0, 5) : [];
  const uploadedUrls = [];

  for (const file of validFiles) {
    if (!file?.buffer) {
      continue;
    }

    const imageUrl = await uploadBufferToCloudinary(file.buffer, 'electromap/stations');
    if (imageUrl) {
      uploadedUrls.push(imageUrl);
    }
  }

  return uploadedUrls;
};

const getChargerStatsMap = async (stationIds) => {
  if (!stationIds.length) {
    return new Map();
  }

  const stats = await Charger.aggregate([
    {
      $match: {
        stationId: { $in: stationIds.map((id) => new mongoose.Types.ObjectId(id)) },
      },
    },
    {
      $group: {
        _id: '$stationId',
        totalChargers: { $sum: 1 },
        availableChargers: {
          $sum: {
            $cond: [{ $eq: ['$status', 'available'] }, 1, 0],
          },
        },
      },
    },
  ]);

  return new Map(stats.map((item) => [String(item._id), item]));
};

const addDistanceAndStats = (stations, origin, statsMap, currentUser) => {
  return stations.map((station) => {
    const [lng, lat] = station.location?.coordinates || [];
    const distanceKm = haversineDistanceKm(origin, { lat, lng });
    const chargerStats = statsMap.get(String(station._id));
    const savedSet = new Set((currentUser?.savedStations || []).map((id) => String(id)));

    return {
      ...station,
      distanceKm: distanceKm !== null ? Number(distanceKm.toFixed(2)) : null,
      totalChargers: chargerStats?.totalChargers ?? station.totalChargers,
      availableChargers: chargerStats?.availableChargers ?? station.availableChargers,
      isOpen: isStationOpenNow(station.operatingHours),
      isSaved: currentUser ? savedSet.has(String(station._id)) : false,
    };
  });
};

const getNearbyStations = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return errorResponse(res, 'lat and lng query params are required', 400);
    }

    const radius = Number(req.query.radius);
    const radiusMeters = Number.isFinite(radius) && radius > 0 ? radius : DEFAULT_RADIUS_METERS;
    const minRating = Number(req.query.minRating);
    const chargerTypes = normalizeArrayField(req.query.chargerType);
    const isOpenFilter = parseBoolean(req.query.isOpen);
    const { page, limit, skip } = parsePagination(req.query);

    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radiusMeters,
        },
      },
    };

    if (chargerTypes.length) {
      query.chargerTypes = { $in: chargerTypes };
    }

    if (!Number.isNaN(minRating)) {
      query.rating = { $gte: minRating };
    }

    let stations = await Station.find(query).lean();

    if (isOpenFilter !== null) {
      stations = stations.filter((station) => isStationOpenNow(station.operatingHours) === isOpenFilter);
    }

    const total = stations.length;
    const paginatedStations = stations.slice(skip, skip + limit);
    const statsMap = await getChargerStatsMap(paginatedStations.map((station) => station._id));

    const responseStations = addDistanceAndStats(
      paginatedStations,
      { lat, lng },
      statsMap,
      req.user,
    );

    return successResponse(res, {
      stations: responseStations,
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

const getAllStations = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const sortBy = (req.query.sortBy || 'rating').trim().toLowerCase();
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const minRating = Number(req.query.minRating);
    const chargerTypes = normalizeArrayField(req.query.chargerType);

    const filters = {};

    if (!Number.isNaN(minRating)) {
      filters.rating = { $gte: minRating };
    }

    if (chargerTypes.length) {
      filters.chargerTypes = { $in: chargerTypes };
    }

    let total = 0;
    let stations = [];

    if (sortBy === 'distance' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      const [result] = await Station.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            distanceField: 'distanceMeters',
            spherical: true,
            query: filters,
          },
        },
        { $sort: { distanceMeters: 1 } },
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [{ $skip: skip }, { $limit: limit }],
          },
        },
      ]);

      total = result?.metadata?.[0]?.total || 0;
      stations = (result?.data || []).map((station) => ({
        ...station,
        distanceKm: Number((station.distanceMeters / 1000).toFixed(2)),
      }));
    } else {
      const sort =
        sortBy === 'name'
          ? { stationName: 1 }
          : sortBy === 'distance' && !Number.isNaN(lat) && !Number.isNaN(lng)
            ? { stationName: 1 }
            : { rating: -1 };

      const [count, items] = await Promise.all([
        Station.countDocuments(filters),
        Station.find(filters).sort(sort).skip(skip).limit(limit).lean(),
      ]);

      total = count;
      stations = items;
    }

    const statsMap = await getChargerStatsMap(stations.map((station) => station._id));
    const origin = Number.isNaN(lat) || Number.isNaN(lng) ? null : { lat, lng };
    const savedSet = new Set((req.user?.savedStations || []).map((id) => String(id)));

    const enrichedStations = stations.map((station) => {
      const chargerStats = statsMap.get(String(station._id));
      const responseItem = {
        ...station,
        totalChargers: chargerStats?.totalChargers ?? station.totalChargers,
        availableChargers: chargerStats?.availableChargers ?? station.availableChargers,
        isOpen: isStationOpenNow(station.operatingHours),
        isSaved: req.user ? savedSet.has(String(station._id)) : false,
      };

      if (origin && responseItem.distanceKm === undefined) {
        const [stationLng, stationLat] = station.location?.coordinates || [];
        const distanceKm = haversineDistanceKm(origin, { lat: stationLat, lng: stationLng });
        responseItem.distanceKm = distanceKm !== null ? Number(distanceKm.toFixed(2)) : null;
      }

      return responseItem;
    });

    return successResponse(res, {
      stations: enrichedStations,
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

const getStationById = async (req, res, next) => {
  try {
    const station = await Station.findById(req.params.id).lean();

    if (!station) {
      return errorResponse(res, 'Station not found', 404);
    }

    const [chargers, reviews] = await Promise.all([
      Charger.find({ stationId: station._id }).sort({ lastUpdated: -1 }).lean(),
      Review.find({ stationId: station._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'username avatar')
        .lean(),
    ]);

    const availableChargers = chargers.filter((charger) => charger.status === 'available').length;
    const isSaved = req.user
      ? (req.user.savedStations || []).some((id) => String(id) === String(station._id))
      : false;

    return successResponse(res, {
      station: {
        ...station,
        chargers,
        reviews,
        availableChargers,
        totalChargers: chargers.length || station.totalChargers,
        isOpen: isStationOpenNow(station.operatingHours),
        isSaved,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const createStation = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const normalizedPayload = normalizeStationPayload(req.body);
    const parsedPayload = stationSchema.parse({
      ...normalizedPayload,
      availableChargers:
        normalizedPayload.availableChargers === undefined
          ? normalizedPayload.totalChargers
          : normalizedPayload.availableChargers,
    });

    const uploadedImages = await uploadStationImages(req.files);
    const images = [...(parsedPayload.images || []), ...uploadedImages].slice(0, 5);

    let createdStation = null;

    await session.withTransaction(async () => {
      const [stationDoc] = await Station.create(
        [
          {
            ...parsedPayload,
            images,
            addedBy: req.user._id,
          },
        ],
        { session },
      );

      const chargerDocs = buildChargerDocuments(stationDoc._id, parsedPayload);

      if (chargerDocs.length > 0) {
        await Charger.insertMany(chargerDocs, { session });
        stationDoc.totalChargers = chargerDocs.length;
        stationDoc.availableChargers = chargerDocs.filter(
          (charger) => charger.status === 'available',
        ).length;
        await stationDoc.save({ session });
      }

      createdStation = stationDoc.toObject();
    });

    if (createdStation) {
      emitNewStation(req.app.get('io'), createdStation);
    }

    return successResponse(res, { station: createdStation }, 'Station created successfully', 201);
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};

const updateStation = async (req, res, next) => {
  try {
    const station = await Station.findById(req.params.id);

    if (!station) {
      return errorResponse(res, 'Station not found', 404);
    }

    const normalizedPayload = normalizeStationPayload(req.body);
    const parsedPayload = stationSchema.partial().parse(normalizedPayload);

    const uploadedImages = await uploadStationImages(req.files);
    const requestedExistingImages = normalizedPayload.existingImages;

    const baseImages = Array.isArray(requestedExistingImages)
      ? requestedExistingImages
      : station.images || [];

    const images = [...baseImages, ...uploadedImages].slice(0, 5);

    if (uploadedImages.length > 0 || Array.isArray(requestedExistingImages)) {
      station.images = images;
    }

    const { chargers, existingImages, ...stationUpdates } = parsedPayload;

    for (const [key, value] of Object.entries(stationUpdates)) {
      if (value !== undefined) {
        station[key] = value;
      }
    }

    if (Array.isArray(chargers)) {
      await Charger.deleteMany({ stationId: station._id });

      const chargerDocs = buildChargerDocuments(station._id, {
        ...station.toObject(),
        chargers,
      });

      if (chargerDocs.length > 0) {
        await Charger.insertMany(chargerDocs);
      }

      station.totalChargers = chargerDocs.length;
      station.availableChargers = chargerDocs.filter((charger) => charger.status === 'available').length;
    } else if (
      station.totalChargers !== undefined &&
      station.availableChargers !== undefined &&
      station.availableChargers > station.totalChargers
    ) {
      station.availableChargers = station.totalChargers;
    }

    await station.save();

    return successResponse(res, { station: station.toObject() }, 'Station updated successfully');
  } catch (error) {
    return next(error);
  }
};

const deleteStation = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return errorResponse(res, 'Station not found', 404);
    }

    await session.withTransaction(async () => {
      await Station.deleteOne({ _id: station._id }, { session });
      await Charger.deleteMany({ stationId: station._id }, { session });
      await Review.deleteMany({ stationId: station._id }, { session });
    });

    return successResponse(res, null, 'Station deleted successfully');
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};

const searchStations = async (req, res, next) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    if (!query) {
      return errorResponse(res, 'Search query is required', 400);
    }

    const stations = await Station.find(
      { $text: { $search: query } },
      {
        score: { $meta: 'textScore' },
        stationName: 1,
        address: 1,
        city: 1,
        state: 1,
        country: 1,
        rating: 1,
        totalReviews: 1,
        location: 1,
        images: 1,
        availableChargers: 1,
        totalChargers: 1,
      },
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
      .lean();

    return successResponse(res, { stations }, 'Search results fetched');
  } catch (error) {
    return next(error);
  }
};

const saveStation = async (req, res, next) => {
  try {
    const station = await Station.findById(req.params.id).select('_id');
    if (!station) {
      return errorResponse(res, 'Station not found', 404);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { savedStations: station._id } },
      { new: true },
    ).select('savedStations');

    return successResponse(res, { savedStations: user?.savedStations || [] }, 'Station saved');
  } catch (error) {
    return next(error);
  }
};

const unsaveStation = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedStations: req.params.id } },
      { new: true },
    ).select('savedStations');

    return successResponse(res, { savedStations: user?.savedStations || [] }, 'Station removed from saved');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getNearbyStations,
  getAllStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
  searchStations,
  saveStation,
  unsaveStation,
};
