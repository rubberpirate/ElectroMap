const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Station = require('../models/Station');
const Charger = require('../models/Charger');
const Review = require('../models/Review');

const stationsData = [
  {
    stationName: 'ChargePoint Connaught Place Hub',
    address: 'Block A, Connaught Place',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    location: { type: 'Point', coordinates: [77.2167, 28.6315] },
    chargerTypes: ['Level2', 'DC_Fast'],
    totalChargers: 6,
    availableChargers: 3,
    pricing: { perKwh: 21, perMinute: 0, sessionFee: 15, currency: 'INR' },
    operatingHours: { is24Hours: true, open: '00:00', close: '23:59' },
    amenities: ['Parking', 'Cafe', 'Restrooms', 'WiFi'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'GreenVolt Saket EV Plaza',
    address: 'Saket District Centre, Pushp Vihar',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    location: { type: 'Point', coordinates: [77.2062, 28.5234] },
    chargerTypes: ['Level2', 'Tesla_Supercharger'],
    totalChargers: 5,
    availableChargers: 2,
    pricing: { perKwh: 19, perMinute: 0, sessionFee: 10, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '06:00', close: '23:00' },
    amenities: ['Parking', 'Security', 'Restrooms'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'ElectroMax Rohini Charging Bay',
    address: 'Sector 10, Rohini',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    location: { type: 'Point', coordinates: [77.1031, 28.7327] },
    chargerTypes: ['Level1', 'Level2'],
    totalChargers: 4,
    availableChargers: 2,
    pricing: { perKwh: 16, perMinute: 0, sessionFee: 5, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '07:00', close: '22:30' },
    amenities: ['Parking', 'Nearby Shops'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Marine Drive Fast Charge Station',
    address: 'Netaji Subhash Chandra Bose Road, Marine Drive',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    location: { type: 'Point', coordinates: [72.8258, 18.9432] },
    chargerTypes: ['DC_Fast', 'Level2'],
    totalChargers: 8,
    availableChargers: 4,
    pricing: { perKwh: 24, perMinute: 1, sessionFee: 20, currency: 'INR' },
    operatingHours: { is24Hours: true, open: '00:00', close: '23:59' },
    amenities: ['Parking', 'Cafe', 'WiFi', 'Restrooms'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'BKC Power Charge Arena',
    address: 'Bandra Kurla Complex, Bandra East',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    location: { type: 'Point', coordinates: [72.8707, 19.0605] },
    chargerTypes: ['DC_Fast', 'Tesla_Supercharger'],
    totalChargers: 7,
    availableChargers: 3,
    pricing: { perKwh: 25, perMinute: 1, sessionFee: 18, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '05:30', close: '23:30' },
    amenities: ['Parking', 'Security', 'Cafe'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Andheri West EV Connect',
    address: 'Lokhandwala Back Road, Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    location: { type: 'Point', coordinates: [72.8331, 19.1367] },
    chargerTypes: ['Level2', 'Level1'],
    totalChargers: 5,
    availableChargers: 1,
    pricing: { perKwh: 18, perMinute: 0, sessionFee: 8, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '06:30', close: '22:00' },
    amenities: ['Parking', 'Restrooms'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Powai Lake EV Terminal',
    address: 'Hiranandani Gardens, Powai',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    location: { type: 'Point', coordinates: [72.9081, 19.1197] },
    chargerTypes: ['Level2', 'DC_Fast'],
    totalChargers: 6,
    availableChargers: 4,
    pricing: { perKwh: 22, perMinute: 0, sessionFee: 12, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '06:00', close: '23:00' },
    amenities: ['Parking', 'Cafe', 'WiFi'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Silk Board HyperCharge Point',
    address: 'Silk Board Junction, HSR Layout',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    location: { type: 'Point', coordinates: [77.6227, 12.9177] },
    chargerTypes: ['DC_Fast', 'Level2'],
    totalChargers: 8,
    availableChargers: 5,
    pricing: { perKwh: 20, perMinute: 1, sessionFee: 14, currency: 'INR' },
    operatingHours: { is24Hours: true, open: '00:00', close: '23:59' },
    amenities: ['Parking', 'Cafe', 'Restrooms', 'WiFi'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Indiranagar VoltSquare',
    address: '100 Feet Road, Indiranagar',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    location: { type: 'Point', coordinates: [77.6408, 12.9719] },
    chargerTypes: ['Level2', 'Tesla_Supercharger'],
    totalChargers: 6,
    availableChargers: 2,
    pricing: { perKwh: 23, perMinute: 0, sessionFee: 16, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '06:00', close: '23:30' },
    amenities: ['Parking', 'Cafe', 'Security'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Whitefield RapidCharge Zone',
    address: 'ITPL Main Road, Whitefield',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    location: { type: 'Point', coordinates: [77.7499, 12.9698] },
    chargerTypes: ['DC_Fast', 'Level2'],
    totalChargers: 7,
    availableChargers: 3,
    pricing: { perKwh: 22, perMinute: 1, sessionFee: 12, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '05:00', close: '23:59' },
    amenities: ['Parking', 'Food Court', 'Restrooms'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Jayanagar EV Smart Hub',
    address: '4th Block, Jayanagar',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    location: { type: 'Point', coordinates: [77.5848, 12.9250] },
    chargerTypes: ['Level1', 'Level2'],
    totalChargers: 4,
    availableChargers: 2,
    pricing: { perKwh: 17, perMinute: 0, sessionFee: 6, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '07:00', close: '22:00' },
    amenities: ['Parking', 'Nearby Shops'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Hitech City TurboCharge Yard',
    address: 'Madhapur Main Road, Hitech City',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    location: { type: 'Point', coordinates: [78.3772, 17.4474] },
    chargerTypes: ['DC_Fast', 'Level2'],
    totalChargers: 7,
    availableChargers: 4,
    pricing: { perKwh: 21, perMinute: 1, sessionFee: 10, currency: 'INR' },
    operatingHours: { is24Hours: true, open: '00:00', close: '23:59' },
    amenities: ['Parking', 'Cafe', 'WiFi', 'Restrooms'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Banjara Hills GreenPlug Station',
    address: 'Road No. 12, Banjara Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    location: { type: 'Point', coordinates: [78.4380, 17.4163] },
    chargerTypes: ['Level2', 'Tesla_Supercharger'],
    totalChargers: 5,
    availableChargers: 2,
    pricing: { perKwh: 20, perMinute: 0, sessionFee: 12, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '06:00', close: '23:00' },
    amenities: ['Parking', 'Security', 'Restrooms'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Gachibowli EV Express Bay',
    address: 'Financial District Road, Gachibowli',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    location: { type: 'Point', coordinates: [78.3489, 17.4401] },
    chargerTypes: ['DC_Fast', 'Level2'],
    totalChargers: 6,
    availableChargers: 3,
    pricing: { perKwh: 22, perMinute: 1, sessionFee: 15, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '05:30', close: '23:30' },
    amenities: ['Parking', 'Cafe', 'WiFi'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Jubilee Hills Charge Avenue',
    address: 'Road No. 36, Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    location: { type: 'Point', coordinates: [78.4071, 17.4316] },
    chargerTypes: ['Level1', 'Level2'],
    totalChargers: 4,
    availableChargers: 1,
    pricing: { perKwh: 18, perMinute: 0, sessionFee: 7, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '07:00', close: '22:30' },
    amenities: ['Parking', 'Nearby Shops'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'OMR Lightning Charge Hub',
    address: 'OMR Service Road, Thoraipakkam',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    location: { type: 'Point', coordinates: [80.2290, 12.9352] },
    chargerTypes: ['DC_Fast', 'Level2'],
    totalChargers: 8,
    availableChargers: 4,
    pricing: { perKwh: 20, perMinute: 1, sessionFee: 11, currency: 'INR' },
    operatingHours: { is24Hours: true, open: '00:00', close: '23:59' },
    amenities: ['Parking', 'Cafe', 'Restrooms'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'T Nagar EV Connect Plaza',
    address: 'Usman Road, T Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    location: { type: 'Point', coordinates: [80.2337, 13.0418] },
    chargerTypes: ['Level2', 'Tesla_Supercharger'],
    totalChargers: 5,
    availableChargers: 2,
    pricing: { perKwh: 21, perMinute: 0, sessionFee: 13, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '06:00', close: '23:00' },
    amenities: ['Parking', 'Security', 'WiFi'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Velachery SuperCharge Corner',
    address: '100 Feet Bypass Road, Velachery',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    location: { type: 'Point', coordinates: [80.2206, 12.9791] },
    chargerTypes: ['Level2', 'Level1'],
    totalChargers: 4,
    availableChargers: 2,
    pricing: { perKwh: 17, perMinute: 0, sessionFee: 6, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '07:00', close: '22:00' },
    amenities: ['Parking', 'Restrooms'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Phoenix Mall EV Dock',
    address: 'Velachery Main Road, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    location: { type: 'Point', coordinates: [80.2198, 12.9916] },
    chargerTypes: ['DC_Fast', 'Level2'],
    totalChargers: 6,
    availableChargers: 3,
    pricing: { perKwh: 22, perMinute: 1, sessionFee: 10, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '06:00', close: '23:59' },
    amenities: ['Parking', 'Food Court', 'Restrooms', 'WiFi'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Hinjewadi TechPark Charge Zone',
    address: 'Phase 1, Hinjewadi',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    location: { type: 'Point', coordinates: [73.7389, 18.5912] },
    chargerTypes: ['DC_Fast', 'Level2'],
    totalChargers: 7,
    availableChargers: 4,
    pricing: { perKwh: 20, perMinute: 1, sessionFee: 12, currency: 'INR' },
    operatingHours: { is24Hours: true, open: '00:00', close: '23:59' },
    amenities: ['Parking', 'Cafe', 'WiFi'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Koregaon Park VoltBay',
    address: 'North Main Road, Koregaon Park',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    location: { type: 'Point', coordinates: [73.8930, 18.5362] },
    chargerTypes: ['Level2', 'Tesla_Supercharger'],
    totalChargers: 5,
    availableChargers: 2,
    pricing: { perKwh: 22, perMinute: 0, sessionFee: 14, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '06:00', close: '23:00' },
    amenities: ['Parking', 'Security', 'Restrooms'],
    images: [],
    isVerified: true,
  },
  {
    stationName: 'Baner EV Charging Square',
    address: 'Baner Road, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    location: { type: 'Point', coordinates: [73.7908, 18.5590] },
    chargerTypes: ['Level2', 'Level1'],
    totalChargers: 4,
    availableChargers: 1,
    pricing: { perKwh: 17, perMinute: 0, sessionFee: 6, currency: 'INR' },
    operatingHours: { is24Hours: false, open: '07:00', close: '22:30' },
    amenities: ['Parking', 'Nearby Shops'],
    images: [],
    isVerified: true,
  },
];

const connectorByType = {
  Level1: 'Type2',
  Level2: 'Type2',
  DC_Fast: 'CCS2',
  Tesla_Supercharger: 'Tesla',
};

const powerByType = {
  Level1: 3.3,
  Level2: 11,
  DC_Fast: 60,
  Tesla_Supercharger: 120,
};

const buildChargersForStation = (stationId, stationData) => {
  const chargers = [];
  const statuses = ['available', 'occupied', 'maintenance', 'offline'];

  for (let i = 0; i < stationData.totalChargers; i += 1) {
    const chargerType = stationData.chargerTypes[i % stationData.chargerTypes.length];
    let status = 'occupied';

    if (i < stationData.availableChargers) {
      status = 'available';
    } else if (i === stationData.totalChargers - 1 && stationData.totalChargers > 3) {
      status = statuses[(i + stationData.city.length) % statuses.length];
    }

    chargers.push({
      stationId,
      chargerType,
      powerOutput: powerByType[chargerType] || 11,
      connectorType: connectorByType[chargerType] || 'Type2',
      status,
      lastUpdated: new Date(),
    });
  }

  return chargers;
};

const demoUsersSeed = [
  {
    username: 'seedadmin',
    email: 'seed.admin@electromap.in',
    password: 'SeedAdmin123',
    role: 'admin',
  },
  {
    username: 'rahul_driver',
    email: 'rahul.driver@electromap.in',
    password: 'DriverPass123',
    role: 'user',
  },
  {
    username: 'ananya_ev',
    email: 'ananya.ev@electromap.in',
    password: 'DriverPass123',
    role: 'user',
  },
];

const reviewComments = [
  'Fast charging and easy parking access. The session started without delays.',
  'Clean setup and clear signage. Charger status matched the app accurately.',
  'Reached with low battery and got an available charger quickly. Good experience.',
  'Solid location with reliable charging speed. Nearby amenities were useful.',
  'Helpful staff and stable connector output throughout the charging session.',
  'The station layout is easy to navigate, even during peak hours.',
];

const reviewTags = ['Fast', 'Clean', 'Reliable', 'Accessible', 'Safe', 'Good Lighting'];

const upsertDemoUser = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email }).select('+password');

  if (!existingUser) {
    return User.create(payload);
  }

  existingUser.username = payload.username;
  existingUser.role = payload.role;
  existingUser.password = payload.password;

  await existingUser.save();
  return existingUser;
};

const buildReviewDocs = (stations, reviewUsers) => {
  const docs = [];

  stations.forEach((station, stationIndex) => {
    reviewUsers.forEach((user, userIndex) => {
      if ((stationIndex + userIndex) % 2 !== 0) {
        return;
      }

      const rating = 5 - ((stationIndex + userIndex) % 2);
      const comment = reviewComments[(stationIndex + userIndex) % reviewComments.length];
      const tags = [
        reviewTags[(stationIndex + userIndex) % reviewTags.length],
        reviewTags[(stationIndex + userIndex + 2) % reviewTags.length],
      ];

      docs.push({
        stationId: station._id,
        userId: user._id,
        rating,
        comment,
        tags,
        createdAt: new Date(Date.now() - (stationIndex + userIndex + 1) * 86400000),
      });
    });
  });

  return docs;
};

const seedStations = async () => {
  try {
    await connectDB();

    const upsertedUsers = [];
    for (const payload of demoUsersSeed) {
      const user = await upsertDemoUser(payload);
      upsertedUsers.push(user);
    }

    const admin = upsertedUsers.find((user) => user.role === 'admin');
    const driverUsers = upsertedUsers.filter((user) => user.role === 'user');

    if (!admin) {
      throw new Error('Admin user could not be prepared for seeding.');
    }

    await Review.deleteMany({});
    await Charger.deleteMany({});
    await Station.deleteMany({});

    const stationDocs = stationsData.map((station) => ({
      ...station,
      addedBy: admin._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const insertedStations = await Station.insertMany(stationDocs);

    const chargerDocs = insertedStations.flatMap((station, index) =>
      buildChargersForStation(station._id, stationsData[index]),
    );

    if (chargerDocs.length > 0) {
      await Charger.insertMany(chargerDocs);
    }

    const reviewDocs = buildReviewDocs(insertedStations.slice(0, 18), driverUsers);
    if (reviewDocs.length > 0) {
      await Review.create(reviewDocs);
    }

    if (driverUsers[0]) {
      driverUsers[0].savedStations = insertedStations.slice(0, 6).map((station) => station._id);
      await driverUsers[0].save();
    }

    if (driverUsers[1]) {
      driverUsers[1].savedStations = insertedStations.slice(6, 12).map((station) => station._id);
      await driverUsers[1].save();
    }

    console.log(
      `Seed complete: ${insertedStations.length} stations, ${chargerDocs.length} chargers, and ${reviewDocs.length} reviews inserted.`,
    );
    console.log('Demo credentials:');
    console.log('  Admin  -> seed.admin@electromap.in / SeedAdmin123');
    console.log('  Driver -> rahul.driver@electromap.in / DriverPass123');
    console.log('  Driver -> ananya.ev@electromap.in / DriverPass123');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedStations();
