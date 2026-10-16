import React, { useEffect, useRef, useState } from 'react';
import {
  Radio,
  Bike,
  Navigation,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Locate,
  RefreshCw,
  Search,
  Eye,
  ShieldCheck,
  Building2,
  Clock,
  MapPin,
  Play,
  Pause,
  RotateCcw,
  User,
  ShoppingBag,
  ExternalLink,
  Layers,
  Compass
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  AGF_CAFE_HUB, 
  MAX_DELIVERY_RADIUS_KM, 
  calculateDistance, 
  checkDeliveryServiceable,
  calculateETA,
  resolveOrderCoordinates
} from '../../utils/locationUtils';
import { fetchRoadRoute, routePointsToLatLngs, getPointAlongRoute } from '../../utils/routeService';

export const FleetRadarView = ({ onSelectTab }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkersRef = useRef({});
  const activeOrderMarkersRef = useRef({});
  const routePolylineRef = useRef(null);
  const geofenceCircleRef = useRef(null);
  const routePointsRef = useRef([]);

  const [staffList, setStaffList] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activePanelTab, setActivePanelTab] = useState('orders'); // 'orders' | 'riders'
  const [searchQuery, setSearchQuery] = useState('');
  const [mapReady, setMapReady] = useState(false);

  // Simulation controls
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0.4);
  const [simSpeed, setSimSpeed] = useState(1);
  const simIntervalRef = useRef(null);
  const simRiderMarkerRef = useRef(null);

  // Selected Order Road Metrics
  const [selectedRouteMetrics, setSelectedRouteMetrics] = useState(null);

  // 1. Subscribe to Delivery Fleet
  useEffect(() => {
    const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      const riders = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const role = String(data.role || '').toLowerCase();
        if (role.includes('delivery') || role.includes('rider') || data.isDeliveryPartner) {
          riders.push({ id: docSnap.id, ...data });
        }
      });
      setStaffList(riders);
    }, (err) => console.warn('FleetRadarView staff listener error:', err));

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const active = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status !== 'Delivered' && data.status !== 'Cancelled') {
          active.push({ id: docSnap.id, ...data });
        }
      });
      setActiveOrders(active);
    }, (err) => console.warn('FleetRadarView orders listener error:', err));

    return () => {
      unsubStaff();
      unsubOrders();
    };
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng],
      zoom: 14,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    // Create high-visibility Route Pane above tile layer
    if (!map.getPane('routePane')) {
      const routePane = map.createPane('routePane');
      routePane.style.zIndex = '550';
    }

    // Google Maps Roadmap Layer
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps',
    }).addTo(map);

    // 5 KM Geofence Radius Circle
    const circle = L.circle([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], {
      radius: MAX_DELIVERY_RADIUS_KM * 1000,
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.06,
      weight: 3.5,
    }).addTo(map);
    geofenceCircleRef.current = circle;

    L.circle([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], {
      radius: MAX_DELIVERY_RADIUS_KM * 1000,
      color: '#f59e0b',
      fillOpacity: 0,
      weight: 1.5,
      dashArray: '6, 8',
    }).addTo(map);

    // Central Cafe Store Hub Marker
    const cafeIcon = L.divIcon({
      className: 'custom-cafe-hub-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border: 3.5px solid white;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(245, 158, 11, 0.6);
          cursor: pointer;
        ">
          <span style="font-size: 22px;">☕</span>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -24],
    });

    const storeMarker = L.marker([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], { icon: cafeIcon }).addTo(map);
    storeMarker.bindPopup(`
      <div style="font-family: inherit; padding: 6px; text-align: center; min-width: 180px;">
        <strong style="color: #d97706; font-size: 14px; display: block; margin-bottom: 2px;">☕ ${AGF_CAFE_HUB.name} Central Hub</strong>
        <p style="margin: 0; font-size: 11px; color: #64748b;">${AGF_CAFE_HUB.address}</p>
        <span style="display:inline-block; margin-top:6px; padding:3px 10px; background:#ecfdf5; color:#047857; font-size:10px; font-weight:bold; border-radius:9999px;">
          5 KM Fleet Origin & Kitchen
        </span>
      </div>
    `);

    setMapReady(true);

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      riderMarkersRef.current = {};
      activeOrderMarkersRef.current = {};
    };
  }, []);

  // 3. Render and Update Rider Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current;

    // Clear removed riders
    Object.keys(riderMarkersRef.current).forEach((id) => {
      if (!staffList.some((r) => r.id === id)) {
        riderMarkersRef.current[id].remove();
        delete riderMarkersRef.current[id];
      }
    });

    staffList.forEach((rider, idx) => {
      let lat = rider.location?.lat ? parseFloat(rider.location.lat) : null;
      let lng = rider.location?.lng ? parseFloat(rider.location.lng) : null;

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        const angle = (idx / Math.max(1, staffList.length)) * 2 * Math.PI;
        lat = AGF_CAFE_HUB.lat + 0.009 * Math.cos(angle);
        lng = AGF_CAFE_HUB.lng + 0.009 * Math.sin(angle);
      }

      const status = rider.status || 'Available';
      const isOnDuty = status === 'On Duty';
      const isAvailable = status === 'Available';
      const markerColor = isOnDuty ? '#f59e0b' : isAvailable ? '#10b981' : '#64748b';

      const riderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`;

      const riderIcon = L.divIcon({
        className: 'custom-fleet-rider-marker',
        html: `
          <div style="
            background: ${markerColor};
            border: 3px solid white;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0,0,0,0.35);
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${riderSvg}
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -20],
      });

      if (riderMarkersRef.current[rider.id]) {
        riderMarkersRef.current[rider.id].setLatLng([lat, lng]);
        riderMarkersRef.current[rider.id].setIcon(riderIcon);
      } else {
        const marker = L.marker([lat, lng], { icon: riderIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: inherit; padding: 4px; min-width: 170px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 4px;">
              <strong style="color: #0f172a; font-size: 13px;">${rider.name}</strong>
              <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 9999px; background: ${markerColor}20; color: ${markerColor};">
                ${status}
              </span>
            </div>
            <p style="margin: 2px 0; font-size: 11px; color: #475569;">📞 ${rider.phone || 'No phone'}</p>
            <p style="margin: 2px 0; font-size: 11px; color: #475569;">🛵 ${rider.vehicle || 'Bike'} &bull; ${rider.vehicleNumber || 'Standard'}</p>
          </div>
        `);
        marker.on('click', () => {
          setSelectedRider(rider);
          setActivePanelTab('riders');
        });
        riderMarkersRef.current[rider.id] = marker;
      }
    });
  }, [staffList, mapReady]);

  // 4. Render Active Order Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current;

    // Clear removed orders
    Object.keys(activeOrderMarkersRef.current).forEach((id) => {
      if (!activeOrders.some((o) => o.id === id)) {
        activeOrderMarkersRef.current[id].remove();
        delete activeOrderMarkersRef.current[id];
      }
    });

    activeOrders.forEach((order) => {
      resolveOrderCoordinates(order).then((coords) => {
        if (!coords || !mapInstanceRef.current) return;

        const isSelected = selectedOrder?.id === order.id;
        const customerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;

        const orderIcon = L.divIcon({
          className: 'custom-order-destination-marker',
          html: `
            <div style="
              background: ${isSelected ? '#f43f5e' : '#2563eb'};
              border: ${isSelected ? '3.5px solid white' : '2.5px solid white'};
              width: ${isSelected ? '36px' : '30px'};
              height: ${isSelected ? '36px' : '30px'};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              cursor: pointer;
              transition: all 0.2s;
            ">
              ${customerSvg}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18],
        });

        if (activeOrderMarkersRef.current[order.id]) {
          activeOrderMarkersRef.current[order.id].setLatLng([coords.lat, coords.lng]);
          activeOrderMarkersRef.current[order.id].setIcon(orderIcon);
        } else {
          const marker = L.marker([coords.lat, coords.lng], { icon: orderIcon }).addTo(map);
          marker.bindPopup(`
            <div style="font-family: inherit; padding: 4px; min-width: 170px;">
              <strong style="color: #1e293b; font-size: 13px;">👤 ${order.customerName || 'Customer'}</strong>
              <p style="margin: 2px 0; font-size: 11px; color: #475569;">#${(order.id || '').slice(0, 8).toUpperCase()}</p>
              <p style="margin: 2px 0; font-size: 11px; color: #2563eb; font-weight: bold;">Status: ${order.status}</p>
            </div>
          `);
          marker.on('click', () => {
            handleSelectOrder(order);
          });
          activeOrderMarkersRef.current[order.id] = marker;
        }
      });
    });
  }, [activeOrders, selectedOrder?.id, mapReady]);

  // Auto-select first active order on map ready so road line is immediately drawn
  useEffect(() => {
    if (activeOrders.length > 0 && mapReady && !selectedOrder) {
      handleSelectOrder(activeOrders[0]);
    }
  }, [activeOrders, mapReady]);

  // 5. When an order is selected, draw road polyline route & zoom
  const handleSelectOrder = async (order) => {
    setSelectedOrder(order);
    setIsSimulating(false);
    setSimProgress(0);

    const coords = await resolveOrderCoordinates(order);
    if (!coords || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Remove previous polyline layers
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    // Fetch road curve route
    const route = await fetchRoadRoute(
      { lat: AGF_CAFE_HUB.lat, lng: AGF_CAFE_HUB.lng },
      { lat: coords.lat, lng: coords.lng }
    );

    let points = route.points;
    if (!points || points.length < 2) {
      points = [
        { lat: AGF_CAFE_HUB.lat, lng: AGF_CAFE_HUB.lng },
        { lat: coords.lat, lng: coords.lng }
      ];
    }

    routePointsRef.current = points;
    const finalDist = route.totalDistanceKm || calculateDistance(AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng, coords.lat, coords.lng);
    const finalMins = route.totalDurationMins || Math.ceil((finalDist / 25) * 60) + 10;

    setSelectedRouteMetrics({
      distanceKm: finalDist,
      durationMins: finalMins,
      destinationCoords: coords,
    });

    const latLngs = routePointsToLatLngs(points);

    // Create 3-Layer High-Contrast Glowing Road Highway Polyline Group
    const polylineGroup = L.featureGroup();

    // 1. Dark Shadow Casing (Outer boundary - makes line pop over any map tiles)
    L.polyline(latLngs, {
      pane: 'routePane',
      color: '#090d16',
      weight: 10,
      opacity: 0.95,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(polylineGroup);

    // 2. Glowing Road Core (Electric Royal Blue)
    L.polyline(latLngs, {
      pane: 'routePane',
      color: '#2563eb',
      weight: 6,
      opacity: 1.0,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(polylineGroup);

    // 3. Directional White Navigation Dashes (Animated visual feel)
    L.polyline(latLngs, {
      pane: 'routePane',
      color: '#ffffff',
      weight: 2,
      opacity: 0.95,
      dashArray: '8, 14',
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(polylineGroup);

    // Tooltip directly on line
    polylineGroup.bindTooltip(
      `<div style="font-weight:bold; font-size:11px; padding: 2px 4px;">🛣️ Road Delivery Route: ${finalDist} km (~${finalMins} mins)</div>`,
      { sticky: true }
    );

    polylineGroup.addTo(map);
    routePolylineRef.current = polylineGroup;

    if (latLngs.length > 0) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [80, 80] });
    }
  };

  // 6. Focus Map on a Rider
  const handleFocusRider = (rider) => {
    setSelectedRider(rider);
    let lat = rider.location?.lat ? parseFloat(rider.location.lat) : null;
    let lng = rider.location?.lng ? parseFloat(rider.location.lng) : null;

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      const idx = staffList.findIndex((s) => s.id === rider.id);
      const angle = (idx / Math.max(1, staffList.length)) * 2 * Math.PI;
      lat = AGF_CAFE_HUB.lat + 0.009 * Math.cos(angle);
      lng = AGF_CAFE_HUB.lng + 0.009 * Math.sin(angle);
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
      if (riderMarkersRef.current[rider.id]) {
        riderMarkersRef.current[rider.id].openPopup();
      }
    }
  };

  // 7. Center on AGF Cafe Hub
  const handleRecenterHub = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], 14, { duration: 1 });
    }
  };

  // 8. Rider Movement Simulation Effect
  useEffect(() => {
    if (isSimulating && routePointsRef.current.length > 1) {
      simIntervalRef.current = setInterval(() => {
        setSimProgress((prev) => {
          if (prev >= 0.98) {
            setIsSimulating(false);
            return 1.0;
          }
          const next = prev + 0.015 * simSpeed;
          const pos = getPointAlongRoute(routePointsRef.current, Math.min(1.0, next));

          if (pos && mapInstanceRef.current) {
            if (!simRiderMarkerRef.current) {
              const simIcon = L.divIcon({
                className: 'sim-moving-bike',
                html: `
                  <div style="
                    background: #f59e0b;
                    border: 3px solid white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.7);
                  ">
                    <span style="font-size: 20px;">🛵</span>
                  </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
              });
              simRiderMarkerRef.current = L.marker([pos.lat, pos.lng], { icon: simIcon }).addTo(mapInstanceRef.current);
            } else {
              simRiderMarkerRef.current.setLatLng([pos.lat, pos.lng]);
            }
          }
          return Math.min(1.0, next);
        });
      }, 300);
    } else {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    }

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isSimulating, simSpeed]);

  // Clean sim marker when order cleared
  useEffect(() => {
    if (!selectedOrder && simRiderMarkerRef.current) {
      simRiderMarkerRef.current.remove();
      simRiderMarkerRef.current = null;
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }
      setSelectedRouteMetrics(null);
    }
  }, [selectedOrder]);

  // Metrics
  const totalRiders = staffList.length;
  const onDutyCount = staffList.filter((r) => r.status === 'On Duty').length;
  const availableCount = staffList.filter((r) => r.status === 'Available' || !r.status).length;
  const offlineCount = staffList.filter((r) => r.status === 'Offline').length;

  const filteredOrders = activeOrders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.id || '').toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.deliveryAddress || '').toLowerCase().includes(q)
    );
  });

  const filteredRiders = staffList.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.name || '').toLowerCase().includes(q) ||
      (r.phone || '').includes(q) ||
      (r.vehicle || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 animate-in fade-in pb-12">
      {/* Top Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 text-xs font-black flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Live Control Radar ("God View")</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>5 KM Geofence Active</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
            Delivery Fleet & Road Radar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time GPS tracking of active delivery riders, road curvature route navigation, and customer delivery points across Baharagora.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSelectOrder({
              id: 'DEMO-832101',
              customerName: 'Student Hostel, Baharagora College',
              deliveryAddress: 'College Road, Baharagora, Jharkhand - 832101',
              totalAmount: 380,
              status: 'Out for Delivery',
              items: [{ name: 'Farmhouse Pizza', quantity: 1 }, { name: 'Cold Coffee', quantity: 1 }]
            })}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-white" />
            <span>Show Test Road Line (College Rd)</span>
          </button>

          <button
            type="button"
            onClick={handleRecenterHub}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4 text-amber-500" />
            <span>Center on AGF Hub</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
            }}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-blue-500" />
            <span>Refresh Tiles</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Fleet</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-800">{totalRiders}</span>
            <span className="text-xs font-bold text-slate-500">Riders Registered</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> On Road Delivering
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-600">{onDutyCount}</span>
            <span className="text-xs font-bold text-amber-700">Riders Busy</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available at Cafe
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-600">{availableCount}</span>
            <span className="text-xs font-bold text-emerald-700">Ready to Dispatch</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-blue-200 shadow-xs bg-blue-50/20">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Kitchen Pipeline</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-blue-600">{activeOrders.length}</span>
            <span className="text-xs font-bold text-blue-700">Active Orders</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Radar Map & Live Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (8 cols): Leaflet Interactive Map */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          
          {/* Map Top Bar */}
          <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-black text-amber-400">AGF HUB BAHARAGORA</span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-slate-300">Lat: {AGF_CAFE_HUB.lat.toFixed(4)}, Lng: {AGF_CAFE_HUB.lng.toFixed(4)}</span>
            </div>

            {selectedOrder && selectedRouteMetrics && (
              <div className="flex items-center gap-4 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="text-amber-300 font-bold">
                  Order #{selectedOrder.id.slice(0, 6).toUpperCase()}
                </span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-emerald-400 font-extrabold">
                  🛣️ {selectedRouteMetrics.distanceKm?.toFixed(2)} km Road
                </span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-amber-400 font-bold">
                  ⏱️ ~{selectedRouteMetrics.durationMins} mins
                </span>
              </div>
            )}
          </div>

          {/* Leaflet Map Canvas */}
          <div className="relative w-full h-[540px] bg-slate-100 overflow-hidden">
            <div 
              ref={mapContainerRef} 
              style={{ width: '100%', height: '100%', minHeight: '540px', zIndex: 1 }} 
              className="w-full h-full" 
            />

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-200 shadow-lg text-[11px] font-bold text-slate-700 flex flex-wrap items-center gap-3 pointer-events-none">
              <div className="flex items-center gap-1.5">
                <span className="text-base">☕</span>
                <span>Cafe Hub</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Available Rider</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Delivering Rider</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Customer Point</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-0.5 bg-emerald-500 border border-emerald-600" />
                <span>5 KM Zone</span>
              </div>
            </div>

            {/* Selected Order Simulation Bar */}
            {selectedOrder && (
              <div className="absolute top-4 left-4 right-4 z-[1000] bg-slate-900/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs text-white">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400">Rider Simulation:</span>
                  <span className="text-slate-300">
                    {selectedOrder.customerName || 'Customer'} ({selectedRouteMetrics?.distanceKm?.toFixed(1)} km)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={`px-3 py-1 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSimulating ? 'bg-amber-400 text-stone-950' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isSimulating ? 'Pause' : 'Simulate Ride'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSimulating(false);
                      setSimProgress(0);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
                    title="Reset Simulation"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <select
                    value={simSpeed}
                    onChange={(e) => setSimSpeed(Number(e.target.value))}
                    className="bg-slate-800 text-slate-200 text-xs font-bold rounded-xl px-2 py-1 border border-slate-700"
                  >
                    <option value="1">1x Speed</option>
                    <option value="2">2x Speed</option>
                    <option value="4">4x Speed</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="ml-2 text-slate-400 hover:text-white text-xs underline cursor-pointer"
                  >
                    Clear Route
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Tabbed Orders & Fleet Panel */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          
          {/* Drawer Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/80 p-2 gap-1.5">
            <button
              type="button"
              onClick={() => setActivePanelTab('orders')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activePanelTab === 'orders'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Active Orders ({activeOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePanelTab('riders')}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activePanelTab === 'riders'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Fleet Riders ({staffList.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activePanelTab === 'orders' ? 'Search orders, customers...' : 'Search riders by name, phone...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Tab 1: Orders List */}
          {activePanelTab === 'orders' && (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-3">
                  <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">No active orders in pipeline</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Click below to preview live road route line from Cafe Store to Customer destination on the map.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSelectOrder({
                      id: 'DEMO-832101',
                      customerName: 'Baharagora College Hostel',
                      deliveryAddress: 'College Road, Baharagora - 832101',
                      totalAmount: 380,
                      status: 'Out for Delivery',
                      items: [{ name: 'Farmhouse Pizza', quantity: 1 }, { name: 'Cold Coffee', quantity: 1 }]
                    })}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Draw Test Road Route</span>
                  </button>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  const isDelivering = order.status === 'Out for Delivery';
                  const isPreparing = order.status === 'Preparing';

                  return (
                    <div
                      key={order.id}
                      onClick={() => handleSelectOrder(order)}
                      className={`p-4 transition-all cursor-pointer hover:bg-amber-50/50 ${
                        isSelected ? 'bg-amber-50/80 border-l-4 border-amber-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <span className="font-mono font-black text-xs text-slate-900 block">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {order.customerName || 'Customer'}
                          </span>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isDelivering ? 'bg-amber-100 text-amber-800' : isPreparing ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                        📍 {order.deliveryAddress || order.shippingAddress?.street || 'Baharagora, Jharkhand'}
                      </p>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-slate-800">
                          ₹{parseFloat(order.totalAmount || order.grandTotal || 0).toFixed(2)}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectOrder(order);
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg font-black text-[10px] uppercase flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Track Route</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: Riders List */}
          {activePanelTab === 'riders' && (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredRiders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Bike className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold">No registered riders match query</p>
                </div>
              ) : (
                filteredRiders.map((rider) => {
                  const isSelected = selectedRider?.id === rider.id;
                  const status = rider.status || 'Available';
                  const isOnDuty = status === 'On Duty';
                  const isAvailable = status === 'Available';

                  return (
                    <div
                      key={rider.id}
                      onClick={() => handleFocusRider(rider)}
                      className={`p-4 transition-all cursor-pointer hover:bg-slate-50 ${
                        isSelected ? 'bg-blue-50/60 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <span className="text-xs font-black text-slate-900 block">{rider.name}</span>
                          <span className="text-[11px] text-slate-500">📞 {rider.phone || 'No phone'}</span>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isOnDuty ? 'bg-amber-100 text-amber-800' : isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>🛵 {rider.vehicle || 'Bike'} ({rider.vehicleNumber || 'Verified'})</span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFocusRider(rider);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Locate className="w-3 h-3 text-blue-600" />
                          <span>Focus Pin</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Drawer Footer */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold">10 KM Radius Fleet Coverage</span>
            <span className="font-bold text-amber-600">Baharagora 832101</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetRadarView;
