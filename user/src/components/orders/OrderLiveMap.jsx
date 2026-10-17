import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AGF_CAFE_HUB,
  calculateDistance,
  checkDeliveryServiceable,
  calculateETA,
  resolveOrderCoordinates,
  getInitialRiderCoordinates
} from '../../utils/locationUtils';
import { useDeliveryRadius } from '../../hooks/useDeliveryRadius';
import { fetchRoadRoute, routePointsToLatLngs } from '../../utils/routeService';
import { Navigation, Clock, ShieldCheck, AlertTriangle, Bike, Bell, CheckCircle2, Phone, Share2 } from 'lucide-react';

export default function OrderLiveMap({ order }) {
  const deliveryRadius = useDeliveryRadius();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);

  const [customerCoords, setCustomerCoords] = useState(null);
  const [initialRiderCoords, setInitialRiderCoords] = useState(null);
  const [serviceCheck, setServiceCheck] = useState(null);

  const [riderPos, setRiderPos] = useState(null);
  const [roadDistance, setRoadDistance] = useState(null);
  const [roadDuration, setRoadDuration] = useState(null);
  const [isCopiedShare, setIsCopiedShare] = useState(false);

  // 1. Resolve coordinates asynchronously on mount
  useEffect(() => {
    let active = true;
    resolveOrderCoordinates(order).then(coords => {
      if (!active) return;
      setCustomerCoords(coords);
      setServiceCheck(checkDeliveryServiceable(coords.lat, coords.lng));
      
      const initialRider = order?.riderLocation && order.riderLocation.lat
        ? { lat: parseFloat(order.riderLocation.lat), lng: parseFloat(order.riderLocation.lng) }
        : getInitialRiderCoordinates(coords.lat, coords.lng);
        
      setInitialRiderCoords(initialRider);
      setRiderPos(initialRider);
    });
    return () => { active = false; };
  }, [order?.id]);

  // 2. Sync live rider location when order.riderLocation updates in Firestore
  useEffect(() => {
    if (order?.riderLocation && order.riderLocation.lat && order.riderLocation.lng) {
      const livePos = { 
        lat: parseFloat(order.riderLocation.lat), 
        lng: parseFloat(order.riderLocation.lng) 
      };
      setRiderPos(livePos);

      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng([livePos.lat, livePos.lng]);
      }
    }
  }, [order?.riderLocation]);

  const distanceToCustomer = riderPos && customerCoords ? calculateDistance(
    riderPos.lat,
    riderPos.lng,
    customerCoords.lat,
    customerCoords.lng
  ) : 0;

  const hubToCustomerStraightLine = customerCoords ? calculateDistance(
    AGF_CAFE_HUB.lat,
    AGF_CAFE_HUB.lng,
    customerCoords.lat,
    customerCoords.lng
  ) : 0;

  const currentETA = roadDuration ? `~${roadDuration} mins` : calculateETA(hubToCustomerStraightLine);
  const displayDistance = roadDistance !== null ? roadDistance.toFixed(2) : hubToCustomerStraightLine.toFixed(2);
  const isNearDoorstep = distanceToCustomer > 0 && distanceToCustomer <= 0.5;

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

    // Dynamic Geofence Circle
    L.circle([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], {
      radius: deliveryRadius * 1000,
      color: serviceCheck.isServiceable ? '#10b981' : '#f43f5e',
      fillColor: serviceCheck.isServiceable ? '#10b981' : '#f43f5e',
      fillOpacity: serviceCheck.isServiceable ? 0.05 : 0.14,
      weight: 3
    }).addTo(map);

    L.circle([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], {
      radius: deliveryRadius * 1000,
      color: '#f59e0b',
      fillOpacity: 0,
      weight: 1.5,
      dashArray: '5, 8'
    }).addTo(map);

    // Custom Icon Generator
    const createIcon = (svg, bgColor) => {
      return L.divIcon({
        className: 'custom-cafe-map-marker',
        html: `
          <div style="
            background: ${bgColor};
            border: 3px solid white;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          ">
            ${svg}
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });
    };

    // Store Hub Marker (Amber Coffee)
    const storeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M10 12h4"/></svg>`;
    const storeIcon = createIcon(storeSvg, '#d97706');
    const storeMarker = L.marker([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], { icon: storeIcon }).addTo(map);
    storeMarker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px; text-align: center;">
        <strong style="color: #d97706; font-size: 13px;">☕ ${AGF_CAFE_HUB.name}</strong>
        <p style="margin: 4px 0 0; font-size: 11px; color: #64748b;">${AGF_CAFE_HUB.address}</p>
        <span style="display:inline-block; margin-top:4px; padding:2px 8px; background:#ecfdf5; color:#047857; font-size:10px; font-weight:bold; border-radius:9999px;">
          Order Cooked & Dispatched Here
        </span>
      </div>
    `);

    // Customer Home Marker (Blue)
    const customerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;
    const customerIcon = createIcon(customerSvg, serviceCheck.isServiceable ? '#2563eb' : '#e11d48');
    const customerMarker = L.marker([customerCoords.lat, customerCoords.lng], { icon: customerIcon }).addTo(map);
    customerMarker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px;">
        <strong style="color: #1e293b; font-size: 13px;">🏠 Your Delivery Address</strong>
        <p style="margin: 4px 0 0; font-size: 11px; color: #64748b;">${order.deliveryAddress || 'Doorstep Destination'}</p>
      </div>
    `);

    // Rider Marker (Express Bike)
    const riderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`;
    const riderIcon = createIcon(riderSvg, '#059669');
    const currentRiderPos = order?.riderLocation && order.riderLocation.lat
      ? { lat: parseFloat(order.riderLocation.lat), lng: parseFloat(order.riderLocation.lng) }
      : initialRiderCoords;

    const riderMarker = L.marker([currentRiderPos.lat, currentRiderPos.lng], { icon: riderIcon }).addTo(map);
    riderMarkerRef.current = riderMarker;
    riderMarker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px; text-align: center;">
        <strong style="color: #059669; font-size: 13px;">🛵 Express Delivery Partner</strong>
        <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">${order.deliveryPartnerName || order.staffName || 'AGF Delivery Fleet'}</p>
      </div>
    `);

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

    // Initial placeholder line group
    const initialLineGroup = createRouteLayerGroup([
      [AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng],
      [customerCoords.lat, customerCoords.lng]
    ]).addTo(map);
    routePolylineRef.current = initialLineGroup;

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

    const bounds = L.latLngBounds([
      [AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng],
      [customerCoords.lat, customerCoords.lng]
    ]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });

    const timer1 = setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
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
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [order?.id, customerCoords]);

  // Share Live Tracking Link
  const handleShareTracking = () => {
    const url = `${window.location.origin}/dashboard/track/${order.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setIsCopiedShare(true);
      setTimeout(() => setIsCopiedShare(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const url = `${window.location.origin}/dashboard/track/${order.id}`;
    const text = encodeURIComponent(`Track my AGF Cafe fresh order live on map ☕🛵: ${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (!customerCoords || !serviceCheck) {
    return (
      <div className="w-full h-72 rounded-3xl bg-stone-100 border border-stone-200 flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-2" />
        <p className="text-xs font-bold text-stone-600">Connecting to Live Delivery Radar...</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl overflow-hidden border border-stone-200 shadow-sm bg-white space-y-0">
      
      {/* 500-Meter Proximity Alert Banner */}
      {isNearDoorstep && (
        <div className="p-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white flex items-center justify-between gap-3 text-xs font-black animate-pulse">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>Rider is within 500 meters of your doorstep! Please keep OTP #{order.deliveryOtp || '----'} ready.</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-mono uppercase">Arriving</span>
        </div>
      )}

      {/* Top HUD Status Bar */}
      <div className="bg-stone-900 text-stone-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800">
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Clock className="w-4 h-4" />
            <span>ETA: <strong className="font-mono text-white">{currentETA}</strong></span>
          </div>

          <div className="h-4 w-px bg-stone-700" />

          <div className="flex items-center gap-1.5 text-emerald-400">
            <Navigation className="w-4 h-4" />
            <span>Road Distance: <strong className="font-mono text-white">{displayDistance} km</strong></span>
          </div>

          <div className="h-4 w-px bg-stone-700 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-1.5 text-stone-400">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{deliveryRadius} KM Cafe Delivery Zone</span>
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            title="Share Tracking on WhatsApp"
          >
            <Share2 className="w-3 h-3" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleShareTracking}
            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
          >
            {isCopiedShare ? 'Link Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Leaflet Map Body */}
      <div className="relative w-full h-[360px] sm:h-[400px] min-h-[360px] bg-stone-100 overflow-hidden shrink-0">
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: '100%', minHeight: '360px', zIndex: 1 }}
          className="w-full h-full min-h-[360px]"
        />

        {/* Floating Distance Pill on Map */}
        <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none bg-stone-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg flex items-center gap-2 border border-stone-700">
          <Bike className="w-3.5 h-3.5 text-amber-400" />
          <span>Rider is {distanceToCustomer.toFixed(1)} km from your home</span>
        </div>
      </div>

      {/* Map Legend & OTP Footer */}
      <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-stone-600 font-bold">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>☕ AGF Cafe Hub</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>🏠 Your Doorstep</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>🛵 Live Rider</span>
          </span>
        </div>

        {order.deliveryOtp && (
          <div className="flex items-center gap-2 bg-amber-100 border border-amber-300 px-3 py-1 rounded-xl text-amber-900 font-bold">
            <span className="text-[11px] uppercase tracking-wider">Handover OTP:</span>
            <span className="font-mono text-sm font-black text-amber-950 tracking-widest">{order.deliveryOtp}</span>
          </div>
        )}
      </div>

    </div>
  );
}
