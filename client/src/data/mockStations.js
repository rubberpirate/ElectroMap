const baseStations = [
  {
    _id: 'mock-delhi-hub',
    stationCode: 'IN-DL-P010082',
    stationName: 'ElectroHub Connaught',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    address: 'Janpath Road, Connaught Place, New Delhi',
    location: { type: 'Point', coordinates: [77.2191, 28.6329] },
    totalChargers: 12,
    availableChargers: 4,
    chargerTypes: ['Level2', 'DC_Fast'],
    rating: 4.6,
    totalReviews: 268,
    status: 'available',
    description: 'High-throughput charging hub near central business district.',
    amenities: ['Cafe', 'Restroom', 'WiFi', 'Parking'],
    pricing: {
      perKwh: 17,
      perMinute: 0,
      sessionFee: 15,
      currency: 'INR',
    },
    operatingHours: {
      is24Hours: true,
      open: '00:00',
      close: '23:59',
    },
    images: [],
  },
  {
    _id: 'mock-gurgaon-loop',
    stationCode: 'IN-GR-GFXA0380',
    stationName: 'Cyber City Loop',
    city: 'Gurugram',
    state: 'Haryana',
    country: 'India',
    address: 'DLF Cyber City, Gurugram',
    location: { type: 'Point', coordinates: [77.0909, 28.4959] },
    totalChargers: 8,
    availableChargers: 2,
    chargerTypes: ['Level2', 'DC_Fast'],
    rating: 4.4,
    totalReviews: 154,
    status: 'available',
    description: 'Compact urban charging point for office commuters.',
    amenities: ['Cafe', 'Parking'],
    pricing: {
      perKwh: 18,
      perMinute: 0,
      sessionFee: 10,
      currency: 'INR',
    },
    operatingHours: {
      is24Hours: false,
      open: '06:00',
      close: '23:30',
    },
    images: [],
  },
  {
    _id: 'mock-mumbai-sealink',
    stationCode: 'IN-MH-P020131',
    stationName: 'Sea Link Fast Charge',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    address: 'Bandra Reclamation, Mumbai',
    location: { type: 'Point', coordinates: [72.8401, 19.0413] },
    totalChargers: 10,
    availableChargers: 1,
    chargerTypes: ['DC_Fast', 'Tesla_Supercharger'],
    rating: 4.8,
    totalReviews: 312,
    status: 'occupied',
    description: 'Premium high-power station serving coastal corridor traffic.',
    amenities: ['Lounge', 'Restroom', 'Parking'],
    pricing: {
      perKwh: 21,
      perMinute: 2,
      sessionFee: 20,
      currency: 'INR',
    },
    operatingHours: {
      is24Hours: true,
      open: '00:00',
      close: '23:59',
    },
    images: [],
  },
  {
    _id: 'mock-pune-senapati',
    stationCode: 'IN-PN-P003792',
    stationName: 'Senapati Smart Charge',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    address: 'Senapati Bapat Road, Pune',
    location: { type: 'Point', coordinates: [73.8294, 18.5314] },
    totalChargers: 6,
    availableChargers: 3,
    chargerTypes: ['Level2'],
    rating: 4.2,
    totalReviews: 88,
    status: 'available',
    description: 'City center charging node with predictable turn-around times.',
    amenities: ['Restroom', 'WiFi'],
    pricing: {
      perKwh: 15,
      perMinute: 0,
      sessionFee: 8,
      currency: 'INR',
    },
    operatingHours: {
      is24Hours: false,
      open: '07:00',
      close: '22:00',
    },
    images: [],
  },
  {
    _id: 'mock-bengaluru-orbit',
    stationCode: 'IN-BL-T2973',
    stationName: 'Orbit Ring EV Yard',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    address: 'Outer Ring Road, Bengaluru',
    location: { type: 'Point', coordinates: [77.6521, 12.9279] },
    totalChargers: 14,
    availableChargers: 7,
    chargerTypes: ['Level2', 'DC_Fast'],
    rating: 4.7,
    totalReviews: 401,
    status: 'available',
    description: 'Large multi-bay station optimized for peak office rush hours.',
    amenities: ['Cafe', 'Lounge', 'WiFi', 'Parking'],
    pricing: {
      perKwh: 19,
      perMinute: 1,
      sessionFee: 12,
      currency: 'INR',
    },
    operatingHours: {
      is24Hours: true,
      open: '00:00',
      close: '23:59',
    },
    images: [],
  },
  {
    _id: 'mock-hyderabad-hitech',
    stationCode: 'IN-HY-H2973',
    stationName: 'HiTech Spur Station',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    address: 'Madhapur Main Road, Hyderabad',
    location: { type: 'Point', coordinates: [78.3827, 17.4486] },
    totalChargers: 9,
    availableChargers: 0,
    chargerTypes: ['Level2', 'DC_Fast'],
    rating: 4.1,
    totalReviews: 102,
    status: 'occupied',
    description: 'Business district chargers with real-time status signaling.',
    amenities: ['Restroom', 'Parking'],
    pricing: {
      perKwh: 16,
      perMinute: 1,
      sessionFee: 5,
      currency: 'INR',
    },
    operatingHours: {
      is24Hours: false,
      open: '06:30',
      close: '23:00',
    },
    images: [],
  },
  {
    _id: 'mock-vijayawada-riverfront',
    stationCode: 'IN-AP-VJ1021',
    stationName: 'Vijayawada Riverfront Hub',
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    country: 'India',
    address: 'MG Road, Vijayawada',
    location: { type: 'Point', coordinates: [80.648, 16.5062] },
    totalChargers: 11,
    availableChargers: 5,
    chargerTypes: ['Level2', 'DC_Fast'],
    rating: 4.5,
    totalReviews: 186,
    status: 'available',
    description: 'High-demand charging hub serving the central Vijayawada corridor.',
    amenities: ['Cafe', 'Restroom', 'WiFi', 'Parking'],
    pricing: {
      perKwh: 16,
      perMinute: 1,
      sessionFee: 10,
      currency: 'INR',
    },
    operatingHours: {
      is24Hours: true,
      open: '00:00',
      close: '23:59',
    },
    images: [],
  },
  {
    _id: 'mock-vijayawada-benzcircle',
    stationCode: 'IN-AP-VJ2044',
    stationName: 'Benz Circle Fast Charge',
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    country: 'India',
    address: 'Benz Circle, Vijayawada',
    location: { type: 'Point', coordinates: [80.6579, 16.5069] },
    totalChargers: 8,
    availableChargers: 2,
    chargerTypes: ['DC_Fast', 'Level2'],
    rating: 4.3,
    totalReviews: 119,
    status: 'available',
    description: 'Fast-turnaround station for urban commutes and highway transitions.',
    amenities: ['Restroom', 'Parking'],
    pricing: {
      perKwh: 18,
      perMinute: 1,
      sessionFee: 12,
      currency: 'INR',
    },
    operatingHours: {
      is24Hours: false,
      open: '05:30',
      close: '23:30',
    },
    images: [],
  },
  {
    _id: 'mock-amaravati-core',
    stationCode: 'IN-AP-AM3320',
    stationName: 'Amaravati Core Station',
    city: 'Amaravati',
    state: 'Andhra Pradesh',
    country: 'India',
    address: 'Seed Access Road, Amaravati',
    location: { type: 'Point', coordinates: [80.5112, 16.5417] },
    totalChargers: 7,
    availableChargers: 3,
    chargerTypes: ['Level2'],
    rating: 4.1,
    totalReviews: 62,
    status: 'available',
    description: 'Reliable medium-capacity station near administrative district access roads.',
    amenities: ['Parking', 'WiFi'],
    pricing: {
      perKwh: 15,
      perMinute: 0,
      sessionFee: 5,
      currency: 'INR',
    },
    operatingHours: {
      is24Hours: false,
      open: '06:30',
      close: '22:30',
    },
    images: [],
  },
  {
    _id: 'mock-guntur-transit',
    stationCode: 'IN-AP-GT4402',
    stationName: 'Guntur Transit Charger',
    city: 'Guntur',
    state: 'Andhra Pradesh',
    country: 'India',
    address: 'Ring Road Junction, Guntur',
    location: { type: 'Point', coordinates: [80.4365, 16.3067] },
    totalChargers: 6,
    availableChargers: 1,
    chargerTypes: ['Level2', 'Level1'],
    rating: 4.0,
    totalReviews: 48,
    status: 'occupied',
    description: 'Transit-focused charger cluster ideal for regional intra-city routes.',
    amenities: ['Parking'],
    pricing: {
      perKwh: 14,
      perMinute: 0,
      sessionFee: 0,
      currency: 'INR',
    },
    operatingHours: {
      is24Hours: false,
      open: '07:00',
      close: '22:00',
    },
    images: [],
  },
  {
    _id: 'mock-visakhapatnam-port',
    stationCode: 'IN-AP-VZ5509',
    stationName: 'Vizag Port EV Plaza',
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    country: 'India',
    address: 'Beach Road, Visakhapatnam',
    location: { type: 'Point', coordinates: [83.3058, 17.6868] },
    totalChargers: 9,
    availableChargers: 4,
    chargerTypes: ['Level2', 'DC_Fast'],
    rating: 4.4,
    totalReviews: 96,
    status: 'available',
    description: 'Coastal charging plaza with high throughput during peak evening traffic.',
    amenities: ['Cafe', 'Restroom', 'Parking'],
    pricing: {
      perKwh: 17,
      perMinute: 1,
      sessionFee: 10,
      currency: 'INR',
    },
    operatingHours: {
      is24Hours: true,
      open: '00:00',
      close: '23:59',
    },
    images: [],
  },
  {
    _id: 'mock-chennai-marina',
    stationCode: 'IN-CH-004921',
    stationName: 'Marina Grid Charge',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    address: 'Anna Salai, Chennai',
    location: { type: 'Point', coordinates: [80.252, 13.059] },
    totalChargers: 7,
    availableChargers: 2,
    chargerTypes: ['Level1', 'Level2'],
    rating: 4.0,
    totalReviews: 74,
    status: 'available',
    description: 'Reliable city corridor station with moderate queue times.',
    amenities: ['Cafe', 'Restroom'],
    pricing: {
      perKwh: 14,
      perMinute: 0,
      sessionFee: 0,
      currency: 'INR',
    },
    operatingHours: {
      is24Hours: false,
      open: '07:30',
      close: '21:30',
    },
    images: [],
  },
  {
    _id: 'mock-ahmedabad-riverfront',
    stationCode: 'IN-AH-001584',
    stationName: 'Riverfront Charge Point',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    address: 'Riverfront West Road, Ahmedabad',
    location: { type: 'Point', coordinates: [72.5714, 23.0332] },
    totalChargers: 5,
    availableChargers: 1,
    chargerTypes: ['Level2'],
    rating: 3.9,
    totalReviews: 43,
    status: 'maintenance',
    description: 'Compact station with dependable overnight access.',
    amenities: ['Parking'],
    pricing: {
      perKwh: 13,
      perMinute: 0,
      sessionFee: 0,
      currency: 'INR',
    },
    operatingHours: {
      is24Hours: false,
      open: '08:00',
      close: '22:00',
    },
    images: [],
  },
]

const toRadians = (value) => (value * Math.PI) / 180

const haversineDistanceKm = (origin, target) => {
  const [originLng, originLat] = origin || []
  const [targetLng, targetLat] = target || []

  if (![originLng, originLat, targetLng, targetLat].every((value) => Number.isFinite(Number(value)))) {
    return null
  }

  const earthRadiusKm = 6371
  const dLat = toRadians(Number(targetLat) - Number(originLat))
  const dLng = toRadians(Number(targetLng) - Number(originLng))

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(Number(originLat))) *
      Math.cos(toRadians(Number(targetLat))) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

const cloneStation = (station) => ({
  ...station,
  location: station?.location
    ? {
        ...station.location,
        coordinates: Array.isArray(station.location.coordinates)
          ? [...station.location.coordinates]
          : station.location.coordinates,
      }
    : station.location,
  chargerTypes: Array.isArray(station?.chargerTypes) ? [...station.chargerTypes] : [],
  amenities: Array.isArray(station?.amenities) ? [...station.amenities] : [],
  pricing: station?.pricing ? { ...station.pricing } : station?.pricing,
  operatingHours: station?.operatingHours
    ? { ...station.operatingHours }
    : station?.operatingHours,
  images: Array.isArray(station?.images) ? [...station.images] : [],
})

export const getMockStations = () => baseStations.map(cloneStation)

export const getMockStationById = (stationId) =>
  getMockStations().find((station) => String(station?._id) === String(stationId)) || null

export const getMockNearbyStations = ({
  lat,
  lng,
  radiusKm = 25,
  page = 1,
  limit = 20,
}) => {
  const origin = [Number(lng), Number(lat)]
  const validRadiusKm = Math.max(1, Number(radiusKm) || 25)
  const safePage = Math.max(1, Number(page) || 1)
  const safeLimit = Math.max(1, Number(limit) || 20)

  const sorted = getMockStations()
    .map((station) => {
      const coordinates = station?.location?.coordinates || []
      const distanceKm = haversineDistanceKm(origin, coordinates)
      return {
        ...station,
        distanceKm: distanceKm === null ? null : Number(distanceKm.toFixed(2)),
        isOpen: true,
      }
    })
    .filter((station) => {
      if (station.distanceKm === null) {
        return false
      }
      return station.distanceKm <= validRadiusKm
    })
    .sort((first, second) => (first.distanceKm || 0) - (second.distanceKm || 0))

  const start = (safePage - 1) * safeLimit
  const end = start + safeLimit
  const paginatedStations = sorted.slice(start, end)

  return {
    stations: paginatedStations,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: sorted.length,
      pages: Math.max(1, Math.ceil(sorted.length / safeLimit)),
    },
  }
}

export const searchMockStations = (query) => {
  const trimmed = String(query || '').trim().toLowerCase()
  if (!trimmed) {
    return []
  }

  return getMockStations().filter((station) => {
    const haystack = `${station?.stationName || ''} ${station?.city || ''} ${station?.address || ''}`.toLowerCase()
    return haystack.includes(trimmed)
  })
}
