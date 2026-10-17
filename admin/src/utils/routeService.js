import { loadGoogleMaps } from './googleMapsLoader';
import { calculateDistance } from './locationUtils';

/**
 * Fetches real road route points between origin and destination.
 * Dual-Engine Strategy:
 *   1. Uses Google Maps DirectionsService if VITE_GOOGLE_MAPS_API_KEY is configured.
 *   2. Free OSRM Driving Engine (Zero API Key needed) for real road curvatures.
 *   3. Safe straight-line fallback if offline.
 */
export async function fetchRoadRoute(origin, destination, waypoints = []) {
  if (!origin || !destination) {
    return { points: [], totalDistanceKm: 0, totalDurationMins: 0, success: false };
  }

  // 1. Try Google Maps Directions API if configured
  try {
    const maps = await loadGoogleMaps();
    if (maps && maps.DirectionsService) {
      const directionsService = new maps.DirectionsService();

      const waypointsList = (waypoints || []).map(wp => ({
        location: new maps.LatLng(wp.lat, wp.lng),
        stopover: false
      }));

      const result = await new Promise((resolve, reject) => {
        directionsService.route(
          {
            origin: new maps.LatLng(origin.lat, origin.lng),
            destination: new maps.LatLng(destination.lat, destination.lng),
            waypoints: waypointsList,
            travelMode: maps.TravelMode.DRIVING,
            optimizeWaypoints: false
          },
          (response, status) => {
            if (status === 'OK') {
              resolve(response);
            } else {
              reject(new Error(`Google directions request failed: ${status}`));
            }
          }
        );
      });

      const routePoints = [];
      const route = result.routes[0];
      let totalDistanceMeters = 0;
      let totalDurationSeconds = 0;

      if (route && route.legs) {
        for (const leg of route.legs) {
          totalDistanceMeters += leg.distance?.value || 0;
          totalDurationSeconds += leg.duration?.value || 0;
          for (const step of leg.steps || []) {
            for (const point of step.path || []) {
              routePoints.push({ lat: point.lat(), lng: point.lng() });
            }
          }
        }
      }

      if (routePoints.length > 0) {
        return {
          points: routePoints,
          totalDistanceKm: Math.round((totalDistanceMeters / 1000) * 100) / 100,
          totalDurationMins: Math.ceil(totalDurationSeconds / 60),
          success: true,
          engine: 'google'
        };
      }
    }
  } catch (err) {
    // Google Maps key not present or failed, safely proceed to Engine 2 (OSRM)
  }

  // 2. Engine 2: High-Precision Free OSRM Public Driving Routing Engine
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const response = await fetch(osrmUrl, { method: 'GET' });
    if (response.ok) {
      const data = await response.json();
      if (data && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const rawCoords = route.geometry?.coordinates || []; // [[lng, lat], ...]
        const points = rawCoords.map(coord => ({
          lat: coord[1],
          lng: coord[0]
        }));

        const totalDistanceKm = Math.round((route.distance / 1000) * 100) / 100;
        const totalDurationMins = Math.ceil(route.duration / 60);

        if (points.length > 1) {
          return {
            points,
            totalDistanceKm,
            totalDurationMins,
            success: true,
            engine: 'osrm'
          };
        }
      }
    }
  } catch (osrmError) {
    console.warn("OSRM road routing fallback active:", osrmError.message);
  }

  // 3. Fallback: Interpolated road line with realistic road curvature factor (1.25x)
  const fallbackPoints = [
    { lat: origin.lat, lng: origin.lng },
    ...waypoints,
    { lat: destination.lat, lng: destination.lng }
  ];

  const straightLine = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  const estimatedRoadKm = Math.round(straightLine * 1.25 * 100) / 100;

  return {
    points: fallbackPoints,
    totalDistanceKm: estimatedRoadKm,
    totalDurationMins: Math.ceil((estimatedRoadKm / 26) * 60) + 12,
    success: true,
    engine: 'estimated-road'
  };
}

/**
 * Converts route points array to Leaflet-compatible format [[lat, lng], ...]
 */
export function routePointsToLatLngs(points) {
  if (!points || !Array.isArray(points)) return [];
  return points.map(p => [p.lat, p.lng]);
}

/**
 * Finds the exact coordinates along the road route at progress ratio (0.0 to 1.0)
 */
export function getPointAlongRoute(routePoints, progress) {
  if (!routePoints || routePoints.length === 0) return { lat: 0, lng: 0 };
  if (progress <= 0) return routePoints[0];
  if (progress >= 1) return routePoints[routePoints.length - 1];

  let totalLength = 0;
  const segmentLengths = [];
  for (let i = 0; i < routePoints.length - 1; i++) {
    const dx = routePoints[i + 1].lat - routePoints[i].lat;
    const dy = routePoints[i + 1].lng - routePoints[i].lng;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    segmentLengths.push(segLen);
    totalLength += segLen;
  }

  if (totalLength === 0) return routePoints[0];

  const targetDist = progress * totalLength;
  let accumulated = 0;

  for (let i = 0; i < segmentLengths.length; i++) {
    if (accumulated + segmentLengths[i] >= targetDist) {
      const remainingInSegment = targetDist - accumulated;
      const segRatio = remainingInSegment / (segmentLengths[i] || 1);
      return {
        lat: routePoints[i].lat + (routePoints[i + 1].lat - routePoints[i].lat) * segRatio,
        lng: routePoints[i].lng + (routePoints[i + 1].lng - routePoints[i].lng) * segRatio
      };
    }
    accumulated += segmentLengths[i];
  }

  return routePoints[routePoints.length - 1];
}
