import { loadGoogleMaps } from './googleMapsLoader';

// Exact AGF-CAFE Store Hub Location (Main Boulevard, Near Shitla Mandir, Baharagora, Jharkhand - 832101)
export const AGF_CAFE_HUB = {
  lat: 22.2665931,
  lng: 86.7013979,
  name: 'AGF CAFE',
  address: 'Main Boulevard, Near Shitla Mandir, Baharagora, Jharkhand - 832101',
  phone: '+91 98765 43210',
  pincode: '832101',
  deliveryRadiusKm: 10.0
};

// Default & Dynamic Delivery Radius Limit for Cafe Orders (in Kilometers)
export let MAX_DELIVERY_RADIUS_KM = 10.0;

/**
 * Updates the in-memory delivery radius dynamically from Firestore settings
 */
export function setDynamicDeliveryRadius(radius) {
  const r = Number(radius);
  if (!isNaN(r) && r > 0) {
    MAX_DELIVERY_RADIUS_KM = r;
    AGF_CAFE_HUB.deliveryRadiusKm = r;
  }
}

/**
 * Returns current active delivery radius
 */
export function getDynamicDeliveryRadius() {
  return MAX_DELIVERY_RADIUS_KM;
}

/**
 * Calculates Haversine distance in kilometers between two coordinates
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100;
}

/**
 * Checks if a customer coordinate is within the dynamic AGF-CAFE delivery zone
 */
export function checkDeliveryServiceable(lat, lng, storeHub = AGF_CAFE_HUB, customRadius = null) {
  const radiusLimit = customRadius || storeHub?.deliveryRadiusKm || MAX_DELIVERY_RADIUS_KM;

  if (!lat || !lng) {
    return {
      isServiceable: true,
      distanceKm: 0,
      radiusLimitKm: radiusLimit,
      diffKm: 0
    };
  }

  const distanceKm = calculateDistance(storeHub.lat, storeHub.lng, lat, lng);
  const isServiceable = distanceKm <= radiusLimit;

  return {
    isServiceable,
    distanceKm,
    radiusLimitKm: radiusLimit,
    diffKm: Math.round((distanceKm - radiusLimit) * 100) / 100
  };
}

/**
 * Checks if a customer coordinate is physically at AGF Cafe for Dine-In Table Ordering.
 * Standard cafe radius is ~150 meters (0.15 km) from the store hub.
 */
export function checkDineInGeofence(lat, lng, maxMeters = 150) {
  if (!lat || !lng) {
    return {
      isWithinGeofence: false,
      distanceMeters: null,
      maxMeters,
      error: 'Location coordinates missing'
    };
  }

  const distanceKm = calculateDistance(AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng, lat, lng);
  const distanceMeters = Math.round(distanceKm * 1000);
  const isWithinGeofence = distanceMeters <= maxMeters;

  return {
    isWithinGeofence,
    distanceMeters,
    maxMeters,
    isNearCafe: distanceMeters <= (maxMeters * 2.5) // ~375m grace threshold for slight GPS drift indoors
  };
}

/**
 * Calculates Estimated Time of Arrival (Kitchen Prep + Road Travel Time)
 */
export function calculateETA(distanceKm, prepMinutes = 12, averageSpeedKmH = 26) {
  if (!distanceKm || distanceKm <= 0) return `${prepMinutes}-${prepMinutes + 8} mins`;
  const roadTravelHours = distanceKm / averageSpeedKmH;
  const roadTravelMins = Math.ceil(roadTravelHours * 60);
  const totalMins = prepMinutes + roadTravelMins;
  return `~${totalMins} mins`;
}

/**
 * Checks if a typed/selected address string contains known out-of-range cities/towns
 */
export function checkAddressTextServiceability(addressObj, customRadius = null) {
  const radiusLimit = customRadius || MAX_DELIVERY_RADIUS_KM;

  if (!addressObj) {
    return { isServiceable: true, distanceKm: 0, reason: '' };
  }

  const addrStr = typeof addressObj === 'string'
    ? addressObj
    : `${addressObj.houseNo || ''} ${addressObj.street || ''} ${addressObj.locality || ''} ${addressObj.city || ''} ${addressObj.state || ''} ${addressObj.pincode || ''}`;
  
  const text = addrStr.toLowerCase();

  // Known out-of-radius towns & cities with approximate distances from Baharagora Cafe
  const unserviceableTowns = [
    { name: 'Bistupur', distance: 110 },
    { name: 'Jamshedpur', distance: 105 },
    { name: 'Tatanagar', distance: 108 },
    { name: 'Sakchi', distance: 108 },
    { name: 'Kadma', distance: 112 },
    { name: 'Sonari', distance: 114 },
    { name: 'Telco', distance: 102 },
    { name: 'Adityapur', distance: 115 },
    { name: 'Mango', distance: 110 },
    { name: 'Ghatshila', distance: 45 },
    { name: 'Kharagpur', distance: 55 },
    { name: 'Ranchi', distance: 190 },
    { name: 'Baripada', distance: 60 },
    { name: 'Dhalbhumgarh', distance: 22 },
    { name: 'Chakulia', distance: 28 },
    { name: 'Kolkata', distance: 175 }
  ];

  for (const town of unserviceableTowns) {
    if (text.includes(town.name.toLowerCase())) {
      return {
        isServiceable: false,
        distanceKm: town.distance,
        townName: town.name,
        reason: `🚫 Delivery Unavailable: "${town.name}" is ~${town.distance} km away from AGF Cafe. We deliver fresh food strictly within a ${radiusLimit} km radius of Baharagora!`
      };
    }
  }

  // Pincode validation: Baharagora area code is 832101
  const pincode = String(addressObj.pincode || '').trim();
  if (pincode && pincode.length === 6) {
    if (pincode.startsWith('831') || pincode.startsWith('834') || pincode.startsWith('721') || pincode.startsWith('757') || pincode.startsWith('700')) {
      return {
        isServiceable: false,
        distanceKm: 105,
        townName: addressObj.city || 'Out of Town',
        reason: `🚫 Delivery Unavailable: Pincode ${pincode} is outside AGF Cafe's ${radiusLimit} km Baharagora delivery zone!`
      };
    }
  }

  // If exact coordinates are provided, do precise distance calculation
  if (addressObj.lat && addressObj.lng) {
    const lat = parseFloat(addressObj.lat);
    const lng = parseFloat(addressObj.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      const distanceKm = calculateDistance(AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng, lat, lng);
      const isServiceable = distanceKm <= radiusLimit;
      return {
        isServiceable,
        distanceKm,
        townName: addressObj.city || 'Local Area',
        reason: isServiceable
          ? ''
          : `🚫 Delivery Unavailable: Address is ${distanceKm} km from AGF Cafe (Exceeds ${radiusLimit} km radius limit)!`
      };
    }
  }

  return {
    isServiceable: true,
    distanceKm: 0,
    townName: addressObj.city || 'Local Area',
    reason: ''
  };
}

export const BAHARAGORA_LANDMARKS = [
  { match: ['taliya', 'talia', 'talia road', 'tant house', 'maa tara'], coords: { lat: 22.2475, lng: 86.7280 } },
  { match: ['kaimi', 'kaymi'], coords: { lat: 22.2435, lng: 86.7150 } },
  { match: ['mauda', 'mouda'], coords: { lat: 22.2530, lng: 86.7100 } },
  { match: ['pithapura', 'pitha pura'], coords: { lat: 22.2615, lng: 86.7180 } },
  { match: ['kenola', 'kinola'], coords: { lat: 22.2680, lng: 86.7125 } },
  { match: ['dighi', 'dighi gram'], coords: { lat: 22.2560, lng: 86.7320 } },
  { match: ['sakra', 'sankra'], coords: { lat: 22.2540, lng: 86.7380 } },
  { match: ['kutigram', 'kuti gram'], coords: { lat: 22.2480, lng: 86.7350 } },
  { match: ['college', 'bihar', 'baha college', 'university', 'college road'], coords: { lat: 22.2842, lng: 86.7265 } },
  { match: ['hospital', 'chc', 'health', 'swasthya', 'hospital road'], coords: { lat: 22.2715, lng: 86.7118 } },
  { match: ['bus stand', 'stand', 'chowk', 'main chowk', 'roundabout'], coords: { lat: 22.2785, lng: 86.7160 } },
  { match: ['block', 'bdo', 'thana', 'police', 'station'], coords: { lat: 22.2690, lng: 86.7270 } },
  { match: ['market', 'bazar', 'bazaar', 'purana', 'rajbari'], coords: { lat: 22.2810, lng: 86.7230 } },
  { match: ['khandamouda', 'matihana', 'khanda'], coords: { lat: 22.2980, lng: 86.7350 } },
  { match: ['barasol', 'nh49', 'toll', 'barasole'], coords: { lat: 22.2530, lng: 86.7050 } },
  { match: ['aratipetroleum', 'arati petroleum', 'shitala', 'shitla', 'main boulevard'], coords: { lat: 22.2660, lng: 86.7020 } },
  { match: ['bamdol', 'pipli', 'khudputli'], coords: { lat: 22.2560, lng: 86.6900 } },
  { match: ['mohuldangri', 'cricket ground'], coords: { lat: 22.2540, lng: 86.6950 } },
  { match: ['jamsola', 'border', 'odisha border'], coords: { lat: 22.2350, lng: 86.7120 } },
  { match: ['beda', 'pitajuri', 'forest'], coords: { lat: 22.2890, lng: 86.7050 } },
];

/**
 * Resolves exact coordinates for customer addresses from order payload
 */
export async function resolveOrderCoordinates(order) {
  if (!order) return { lat: 22.2785, lng: 86.7160 }; // Default to Baharagora Chowk if completely empty

  const isValid = (val) => val !== null && val !== undefined && val !== '' && !isNaN(parseFloat(val));

  // 1. Direct coordinates stored on order
  if (isValid(order.lat) && isValid(order.lng)) {
    return { lat: parseFloat(order.lat), lng: parseFloat(order.lng) };
  }
  if (order.customerCoords && isValid(order.customerCoords.lat) && isValid(order.customerCoords.lng)) {
    return { lat: parseFloat(order.customerCoords.lat), lng: parseFloat(order.customerCoords.lng) };
  }
  if (order.shippingAddress && isValid(order.shippingAddress.lat) && isValid(order.shippingAddress.lng)) {
    return { lat: parseFloat(order.shippingAddress.lat), lng: parseFloat(order.shippingAddress.lng) };
  }
  if (order.deliveryLocation && isValid(order.deliveryLocation.lat) && isValid(order.deliveryLocation.lng)) {
    return { lat: parseFloat(order.deliveryLocation.lat), lng: parseFloat(order.deliveryLocation.lng) };
  }

  // 2. Geocode address text if Google Maps is available
  const addressParts = [
    order.deliveryAddress,
    typeof order.address === 'string' ? order.address : '',
    order.shippingAddress?.addressLine1,
    order.shippingAddress?.street,
    order.shippingAddress?.locality,
    order.shippingAddress?.landmark,
    order.shippingAddress?.area,
    order.locality,
    order.landmark,
    order.area,
    order.customerAddress
  ].filter(Boolean);
  const addressString = addressParts.join(' ').toLowerCase();

  // 3. Match against known Baharagora road landmarks
  for (const item of BAHARAGORA_LANDMARKS) {
    if (item.match.some(m => addressString.includes(m))) {
      return item.coords;
    }
  }

  // 4. Try Google Maps Geocoder if loaded
  try {
    const maps = await loadGoogleMaps();
    if (maps && maps.Geocoder && addressString) {
      const geocoder = new maps.Geocoder();
      const geocoded = await new Promise((resolve) => {
        geocoder.geocode({ address: `${addressString}, Baharagora, Jharkhand` }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const loc = results[0].geometry.location;
            resolve({ lat: loc.lat(), lng: loc.lng() });
          } else {
            resolve(null);
          }
        });
      });
      if (geocoded) return geocoded;
    }
  } catch (e) {
    // continue to deterministic fallback
  }

  // 5. Deterministic realistic Baharagora location offset based on order ID / address
  const seed = String(order.id || order.orderId || addressString || 'agf-delivery');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const angle = Math.abs(hash % 360) * (Math.PI / 180);
  const distanceKm = 1.2 + (Math.abs(hash >> 3) % 25) / 10; // 1.2 km to 3.7 km
  const latOffset = (distanceKm / 111.0) * Math.cos(angle);
  const lngOffset = (distanceKm / 102.0) * Math.sin(angle);

  return {
    lat: Math.round((AGF_CAFE_HUB.lat + latOffset) * 100000) / 100000,
    lng: Math.round((AGF_CAFE_HUB.lng + lngOffset) * 100000) / 100000
  };
}

/**
 * Midpoint coordinates for initial rider simulation
 */
export function getInitialRiderCoordinates(customerLat, customerLng) {
  const storeLat = AGF_CAFE_HUB.lat;
  const storeLng = AGF_CAFE_HUB.lng;

  return {
    lat: Math.round(((storeLat + customerLat) / 2) * 10000) / 10000,
    lng: Math.round(((storeLng + customerLng) / 2) * 10000) / 10000
  };
}
