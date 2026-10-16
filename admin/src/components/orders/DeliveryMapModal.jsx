import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  MapPin,
  Truck,
  Phone,
  User,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Navigation,
  Clock,
  Building2,
  CheckCircle2,
  PhoneCall,
  MessageSquare
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AGF_CAFE_HUB,
  MAX_DELIVERY_RADIUS_KM,
  calculateDistance,
  checkDeliveryServiceable,
  calculateETA,
  resolveOrderCoordinates,
  getInitialRiderCoordinates
} from '../../utils/locationUtils';
import { fetchRoadRoute, routePointsToLatLngs, getPointAlongRoute } from '../../utils/routeService';

const getSafeAddress = (orderObj) => {
  if (!orderObj) return 'Baharagora, Jharkhand';
  const addr = orderObj.deliveryAddress || orderObj.address || orderObj.shippingAddress?.addressLine1;
  if (typeof addr === 'string' && addr.trim()) return addr;
  if (typeof addr === 'object' && addr !== null) {
    const parts = [addr.houseNo, addr.street, addr.city, addr.pincode].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }
  return 'Baharagora, Jharkhand';
};

export default function DeliveryMapModal({ order, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);

  // Road route points stored for simulation interpolation
  const routePointsRef = useRef([]);

  // Movement simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0.4); // 40% along route by default
  const [simSpeed, setSimSpeed] = useState(1);
  const simIntervalRef = useRef(null);

  const [customerCoords, setCustomerCoords] = useState(null);
  const [initialRiderCoords, setInitialRiderCoords] = useState(null);
  const [serviceCheck, setServiceCheck] = useState(null);

  const [currentRiderPos, setCurrentRiderPos] = useState(null);
  const [roadDistance, setRoadDistance] = useState(null);
  const [roadDuration, setRoadDuration] = useState(null);

  useEffect(() => {
    let active = true;
    resolveOrderCoordinates(order).then(coords => {
      if (!active) return;
      setCustomerCoords(coords);
      setServiceCheck(checkDeliveryServiceable(coords.lat, coords.lng));

      const isValid = (val) => val !== null && val !== undefined && val !== '' && !isNaN(parseFloat(val));
      const initialRider = order.riderLocation && isValid(order.riderLocation.lat) && isValid(order.riderLocation.lng)
        ? { lat: parseFloat(order.riderLocation.lat), lng: parseFloat(order.riderLocation.lng) }
        : getInitialRiderCoordinates(coords.lat, coords.lng);
        
      setInitialRiderCoords(initialRider);
      setCurrentRiderPos(initialRider);
    });
    return () => { active = false; };
  }, [order?.id]);

  // Sync rider position when order.riderLocation updates in Firestore
  useEffect(() => {
    const isValid = (val) => val !== null && val !== undefined && val !== '' && !isNaN(parseFloat(val));
    if (order?.riderLocation && isValid(order.riderLocation.lat) && isValid(order.riderLocation.lng)) {
      const livePos = { lat: parseFloat(order.riderLocation.lat), lng: parseFloat(order.riderLocation.lng) };
      setCurrentRiderPos(livePos);

      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng([livePos.lat, livePos.lng]);
      }
    }
  }, [order?.riderLocation]);

  const hubToCustomerStraightLine = customerCoords ? calculateDistance(
    AGF_CAFE_HUB.lat,
    AGF_CAFE_HUB.lng,
    customerCoords.lat,
    customerCoords.lng
  ) : 0;

  const currentETA = roadDuration ? `~${roadDuration} mins` : calculateETA(hubToCustomerStraightLine);
  const displayDistance = roadDistance !== null ? roadDistance.toFixed(2) : hubToCustomerStraightLine.toFixed(2);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || !customerCoords || !initialRiderCoords || !serviceCheck) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    const centerLat = (AGF_CAFE_HUB.lat + customerCoords.lat) / 2;
    const centerLng = (AGF_CAFE_HUB.lng + customerCoords.lng) / 2;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 14,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: true
    });

    mapInstanceRef.current = map;

    // Google Maps Roadmap Tiles with OSM Fallback
    const tileLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 18,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    });
    tileLayer.on('tileerror', (error, tile) => {
      tile.src = `https://tile.openstreetmap.org/${error.coords.z}/${error.coords.x}/${error.coords.y}.png`;
    });
    tileLayer.addTo(map);

    // 10 KM Geofence Circle
    const isServiceable = serviceCheck.isServiceable;
    L.circle([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], {
      radius: MAX_DELIVERY_RADIUS_KM * 1000,
      color: isServiceable ? '#10b981' : '#f43f5e',
      fillColor: isServiceable ? '#10b981' : '#f43f5e',
      fillOpacity: isServiceable ? 0.06 : 0.16,
      weight: 3.5
    }).addTo(map);

    L.circle([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], {
      radius: MAX_DELIVERY_RADIUS_KM * 1000,
      color: '#f59e0b',
      fillOpacity: 0,
      weight: 1.5,
      dashArray: '5, 8'
    }).addTo(map);

    // Custom Icons Generator
    const createCustomIcon = (svgContent, bgColor, borderColor = 'white') => {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background: ${bgColor};
            border: 3px solid ${borderColor};
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          ">
            ${svgContent}
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -20]
      });
    };

    // Store Hub Marker (Amber Coffee)
    const storeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M10 12h4"/></svg>`;
    const storeIcon = createCustomIcon(storeSvg, '#d97706');
    const storeMarker = L.marker([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], { icon: storeIcon }).addTo(map);
    storeMarker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px; text-align: center;">
        <strong style="color: #d97706; font-size: 13px;">☕ ${AGF_CAFE_HUB.name}</strong>
        <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">${AGF_CAFE_HUB.address}</p>
        <span style="display:inline-block; margin-top:4px; padding:2px 8px; background:#ecfdf5; color:#047857; font-size:10px; font-weight:bold; border-radius:9999px;">
          5 KM Fresh Delivery Central Hub
        </span>
      </div>
    `);

    // Customer Home Marker (Blue)
    const customerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;
    const customerIcon = createCustomIcon(customerSvg, serviceCheck.isServiceable ? '#2563eb' : '#e11d48');
    const customerMarker = L.marker([customerCoords.lat, customerCoords.lng], { icon: customerIcon }).addTo(map);
    customerMarker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px;">
        <strong style="color: #1e293b; font-size: 13px;">👤 Customer: ${order.customerName || 'Valued Customer'}</strong>
        <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">📍 ${getSafeAddress(order)}</p>
        <p style="margin: 4px 0 0; font-size: 11px; font-weight: bold; color: ${serviceCheck.isServiceable ? '#059669' : '#e11d48'};">
          Distance from Hub: ${serviceCheck.distanceKm} km (${serviceCheck.isServiceable ? 'Within 5 km Zone' : 'Beyond 5 km Limit!'})
        </p>
      </div>
    `);

    // Rider Marker (Emerald Bike)
    const riderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`;
    const riderIcon = createCustomIcon(riderSvg, '#059669');
    const riderMarker = L.marker([initialRiderCoords.lat, initialRiderCoords.lng], { icon: riderIcon }).addTo(map);
    riderMarkerRef.current = riderMarker;

    // Create high-visibility Route Pane above tile layer
    if (!map.getPane('routePane')) {
      const routePane = map.createPane('routePane');
      routePane.style.zIndex = '550';
    }

    const createRouteLayerGroup = (latLngs) => {
      const group = L.featureGroup();
      // 1. Dark Shadow Casing (Outer boundary)
      L.polyline(latLngs, {
        pane: 'routePane',
        color: '#090d16',
        weight: 10,
        opacity: 0.95,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(group);

      // 2. Glowing Road Core (Electric Royal Blue)
      L.polyline(latLngs, {
        pane: 'routePane',
        color: '#2563eb',
        weight: 6,
        opacity: 1.0,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(group);

      // 3. Directional White Navigation Dashes
      L.polyline(latLngs, {
        pane: 'routePane',
        color: '#ffffff',
        weight: 2,
        opacity: 0.95,
        dashArray: '8, 14',
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(group);

      return group;
    };

    // Placeholder route line
    const initialLineGroup = createRouteLayerGroup([
      [AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng],
      [customerCoords.lat, customerCoords.lng]
    ]).addTo(map);
    routePolylineRef.current = initialLineGroup;

    const bounds = L.latLngBounds([
      [AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng],
      [customerCoords.lat, customerCoords.lng]
    ]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });

    // Fetch real road route from Dual-Engine router
    fetchRoadRoute(
      { lat: AGF_CAFE_HUB.lat, lng: AGF_CAFE_HUB.lng },
      { lat: customerCoords.lat, lng: customerCoords.lng }
    ).then(result => {
      if (!mapInstanceRef.current) return;

      let points = result.points;
      if (!points || points.length < 2) {
        points = [
          { lat: AGF_CAFE_HUB.lat, lng: AGF_CAFE_HUB.lng },
          { lat: customerCoords.lat, lng: customerCoords.lng }
        ];
      }

      routePointsRef.current = points;

      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }

      const latLngs = routePointsToLatLngs(points);
      const roadPolylineGroup = createRouteLayerGroup(latLngs).addTo(mapInstanceRef.current);
      routePolylineRef.current = roadPolylineGroup;

      if (result.success) {
        setRoadDistance(result.totalDistanceKm);
        setRoadDuration(result.totalDurationMins);
      }

      if (latLngs.length > 0) {
        mapInstanceRef.current.fitBounds(L.latLngBounds(latLngs), { padding: [60, 60], maxZoom: 15 });
      }
    });

    const timer1 = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    const timer2 = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }
    }, 450);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [order?.id, customerCoords, initialRiderCoords, serviceCheck]);

  // Movement Simulation Effect
  useEffect(() => {
    if (isSimulating) {
      simIntervalRef.current = setInterval(() => {
        setSimProgress(prev => {
          if (prev >= 0.98) {
            setIsSimulating(false);
            return 1.0;
          }
          return prev + 0.02 * simSpeed;
        });
      }, 500);
    } else {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    }
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isSimulating, simSpeed]);

  // Update simulated rider along real road route
  useEffect(() => {
    if (!customerCoords) return;

    let roundedPos;
    if (routePointsRef.current.length > 2) {
      const roadPos = getPointAlongRoute(routePointsRef.current, simProgress);
      roundedPos = {
        lat: Math.round(roadPos.lat * 10000) / 10000,
        lng: Math.round(roadPos.lng * 10000) / 10000
      };
    } else {
      const lat = AGF_CAFE_HUB.lat + (customerCoords.lat - AGF_CAFE_HUB.lat) * simProgress;
      const lng = AGF_CAFE_HUB.lng + (customerCoords.lng - AGF_CAFE_HUB.lng) * simProgress;
      roundedPos = {
        lat: Math.round(lat * 10000) / 10000,
        lng: Math.round(lng * 10000) / 10000
      };
    }

    setCurrentRiderPos(roundedPos);
    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([roundedPos.lat, roundedPos.lng]);
    }
  }, [simProgress, customerCoords]);

  const riderName = order.deliveryPartnerName || order.staffName || 'AGF Fleet Rider';
  const riderPhone = order.deliveryPartnerPhone || order.staffPhone || '+91 98765 43210';

  if (!customerCoords || !serviceCheck) {
    return (
      <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[1000] animate-fade-in">
        <div className="bg-stone-900 border border-stone-800 text-white w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-500 mb-4" />
          <h3 className="text-base font-black">Locating Delivery Radar...</h3>
          <p className="text-xs text-stone-400 mt-1">Connecting cafe hub coordinates with customer map pin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 text-white flex items-center justify-between gap-4 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Live Delivery Route & Tracking</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-black text-[11px]">
                  #{order.orderId || order.id?.slice(0, 8)}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Baharagora 5 KM Delivery Zone & Live Rider Navigation Radar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {serviceCheck.isServiceable ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {displayDistance} km (Within 5 KM Zone)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                {displayDistance} km (Exceeds 5 KM Limit!)
              </span>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* HUD Bar (Distance, ETA & Simulation Controls) */}
        <div className="bg-stone-900 text-stone-200 px-6 py-3 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">ETA to Customer</span>
                <span className="text-xs font-black text-amber-400">{currentETA}</span>
              </div>
            </div>

            <div className="h-6 w-px bg-stone-700" />

            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">Total Road Distance</span>
                <span className="text-xs font-extrabold text-emerald-400">{displayDistance} km</span>
              </div>
            </div>

            <div className="h-6 w-px bg-stone-700 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-semibold block">Cafe Store Origin</span>
                <span className="text-xs font-bold text-stone-200">Main Boulevard, Baharagora</span>
              </div>
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="flex items-center gap-2 bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800">
            <span className="text-[11px] text-stone-400 font-bold">Rider Simulation:</span>
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSimulating
                  ? 'bg-amber-400 text-stone-950 shadow-xs'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isSimulating ? 'Pause' : 'Simulate'}
            </button>

            <button
              onClick={() => {
                setIsSimulating(false);
                setSimProgress(0);
              }}
              className="p-1 text-stone-400 hover:text-stone-200 cursor-pointer"
              title="Reset Rider Position to Cafe"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <select
              value={simSpeed}
              onChange={(e) => setSimSpeed(Number(e.target.value))}
              className="bg-stone-800 text-stone-200 text-[11px] font-bold rounded px-1.5 py-0.5 border border-stone-700 focus:outline-none"
            >
              <option value="1">1x Speed</option>
              <option value="2">2x Speed</option>
              <option value="4">4x Speed</option>
            </select>
          </div>
        </div>

        {/* Leaflet Map Body */}
        <div className="relative w-full h-[450px] min-h-[450px] bg-stone-100 overflow-hidden shrink-0">
          <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '450px', minHeight: '450px', zIndex: 1 }}
            className="w-full h-[450px] min-h-[450px]"
          />

          {/* Warning Banner if Customer is Beyond 10 KM */}
          {!serviceCheck.isServiceable && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-rose-600 text-white px-4 py-2 rounded-2xl shadow-2xl border border-rose-400 text-xs font-black flex items-center gap-2 animate-bounce">
              <AlertTriangle className="w-4 h-4 text-white" />
              <span>OUT OF SERVICE RADIUS: Customer is {displayDistance} km from AGF Cafe (Exceeds 5 km limit)</span>
            </div>
          )}
        </div>

        {/* Customer & Rider Info Footer Cards */}
        <div className="p-4 sm:p-5 bg-white border-t border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
          
          {/* Customer Details Card */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold border border-blue-200">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-black text-stone-900 text-xs truncate">
                  Customer: {order.customerName || 'Valued Customer'}
                </h4>
                {order.customerPhone && (
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <PhoneCall className="w-3 h-3" /> Call
                  </a>
                )}
              </div>
              <p className="text-[11px] text-stone-600 truncate mt-0.5">
                📍 {getSafeAddress(order)}
              </p>
              {order.deliveryInstructions && (
                <p className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1 inline-block">
                  Note: {order.deliveryInstructions}
                </p>
              )}
            </div>
          </div>

          {/* Delivery Partner Details Card */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold border border-amber-200">
              <Truck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-black text-stone-900 text-xs truncate">
                  Rider: {riderName}
                </h4>
                <a
                  href={`tel:${riderPhone}`}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-[10px] flex items-center gap-1 transition-colors"
                >
                  <PhoneCall className="w-3 h-3" /> Call
                </a>
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5">
                📞 {riderPhone}
              </p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Live Tracking Connected (5 KM Fleet Coverage)
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
