const { z } = require('zod');

const CHARGER_TYPES = ['Level1', 'Level2', 'DC_Fast', 'Tesla_Supercharger'];
const CHARGER_STATUS = ['available', 'occupied', 'offline', 'maintenance'];

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const registerSchema = z.object({
  username: z.string().trim().min(3).max(20),
  email: z.email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const stationSchema = z.object({
  stationName: z.string().trim().min(2),
  address: z.string().trim().min(5),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  country: z.string().trim().min(2),
  location: z.object({
    type: z.literal('Point').default('Point'),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ]),
  }),
  chargerTypes: z.array(z.enum(CHARGER_TYPES)).min(1),
  totalChargers: z.int().min(0),
  availableChargers: z.int().min(0).optional(),
  pricing: z.object({
    perKwh: z.number().min(0),
    perMinute: z.number().min(0),
    sessionFee: z.number().min(0),
    currency: z.string().trim().min(1).default('INR'),
  }),
  operatingHours: z.object({
    is24Hours: z.boolean(),
    open: z.string().regex(timeRegex),
    close: z.string().regex(timeRegex),
  }),
  amenities: z.array(z.string().trim()).default([]),
  images: z.array(z.string().trim()).default([]),
  isVerified: z.boolean().optional(),
  chargers: z
    .array(
      z.object({
        chargerType: z.enum(CHARGER_TYPES),
        powerOutput: z.number().min(0),
        connectorType: z.string().trim().min(1),
        status: z.enum(CHARGER_STATUS).default('available'),
      }),
    )
    .optional(),
});

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().trim().min(10).max(500),
  tags: z.array(z.string().trim()).optional(),
});

const chargerStatusSchema = z.object({
  status: z.enum(CHARGER_STATUS),
});

module.exports = {
  CHARGER_TYPES,
  CHARGER_STATUS,
  registerSchema,
  loginSchema,
  stationSchema,
  reviewSchema,
  chargerStatusSchema,
};
