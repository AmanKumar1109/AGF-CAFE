import React, { useEffect, useRef, useState } from 'react';
import {
  X,
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
  Building2
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { AGF_CAFE_HUB, MAX_DELIVERY_RADIUS_KM, calculateDistance } from '../../utils/locationUtils';

export default function FleetRadarModal({ isOpen, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkersRef = useRef({});

  const [staffList, setStaffList] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'on_duty' | 'available'
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Subscribe to Staff collection
  useEffect(() => {
    if (!isOpen) return;

    const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      const riders = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const role = String(data.role || '').toLowerCase();
        if (role.includes('delivery') || role.includes('rider') || data.isDeliveryPartner) {
          riders.push({ id: docSnap.id, ...data });
        }
      });
      setStaffList(riders);
    }, err => console.warn("Staff fleet subscribe error:", err));

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const active = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status !== 'Delivered' && data.status !== 'Cancelled') {
          active.push({ id: docSnap.id, ...data });
        }
      });
      setActiveOrders(active);
    }, err => console.warn("Orders fleet subscribe error:", err));

    return () => {
      unsubStaff();
      unsubOrders();
    };
  }, [isOpen]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng],
      zoom: 14,
      zoomControl: true
    });
    mapInstanceRef.current = map;

    // Google Maps Roadmap Tiles
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }).addTo(map);

    // 10 KM Geofence Delivery Radius Zone Circle
    L.circle([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], {
      radius: MAX_DELIVERY_RADIUS_KM * 1000,
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.05,
      weight: 3.5
    }).addTo(map);

    L.circle([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], {
      radius: MAX_DELIVERY_RADIUS_KM * 1000,
      color: '#f59e0b',
      fillOpacity: 0,
      weight: 1.5,
      dashArray: '6, 8'
    }).addTo(map);

    // Central Cafe Store Marker
    const cafeIcon = L.divIcon({
      className: 'custom-cafe-hub-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border: 3px solid white;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.5);
        ">
          <span style="font-size: 20px;">☕</span>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    const storeMarker = L.marker([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], { icon: cafeIcon }).addTo(map);
    storeMarker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px; text-align: center;">
        <strong style="color: #d97706; font-size: 14px;">☕ ${AGF_CAFE_HUB.name} Central Kitchen</strong>
        <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">${AGF_CAFE_HUB.address}</p>
        <span style="display:inline-block; margin-top:4px; padding:2px 8px; background:#ecfdf5; color:#047857; font-size:10px; font-weight:bold; border-radius:9999px;">
          5 KM Fleet Coverage Origin
        </span>
      </div>
    `);

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      riderMarkersRef.current = {};
    };
  }, [isOpen]);

  // Update Rider Markers on Map whenever staffList changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old markers that no longer exist
    Object.keys(riderMarkersRef.current).forEach(id => {
      if (!staffList.some(r => r.id === id)) {
        riderMarkersRef.current[id].remove();
        delete riderMarkersRef.current[id];
      }
    });

    staffList.forEach((rider, idx) => {
      // Determine coordinates: use rider.location or pseudo-disperse around cafe
      let lat = rider.location?.lat ? parseFloat(rider.location.lat) : null;
      let lng = rider.location?.lng ? parseFloat(rider.location.lng) : null;

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        // Disperse around cafe within 1.5 km for testing preview
        const angle = (idx / Math.max(1, staffList.length)) * 2 * Math.PI;
        lat = AGF_CAFE_HUB.lat + 0.008 * Math.cos(angle);
        lng = AGF_CAFE_HUB.lng + 0.008 * Math.sin(angle);
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
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          ">
            ${riderSvg}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      if (riderMarkersRef.current[rider.id]) {
        riderMarkersRef.current[rider.id].setLatLng([lat, lng]);
        riderMarkersRef.current[rider.id].setIcon(riderIcon);
      } else {
        const marker = L.marker([lat, lng], { icon: riderIcon }).addTo(map);
        marker.on('click', () => setSelectedRider(rider));
        riderMarkersRef.current[rider.id] = marker;
      }

      riderMarkersRef.current[rider.id].bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; min-width: 140px;">
          <strong style="color: #0f172a; font-size: 13px;">🛵 ${rider.name || 'Delivery Partner'}</strong>
          <p style="margin: 2px 0; font-size: 11px; color: #64748b;">📞 ${rider.phone || 'No phone'}</p>
          <span style="display:inline-block; margin-top:4px; padding:2px 6px; background:${isOnDuty ? '#fef3c7' : '#ecfdf5'}; color:${isOnDuty ? '#b45309' : '#047857'}; font-size:10px; font-weight:bold; border-radius:4px;">
            ${status}
          </span>
        </div>
      `);
    });
  }, [staffList]);

  // Center on a specific rider
  const handleFocusRider = (rider) => {
    setSelectedRider(rider);
    if (!mapInstanceRef.current) return;

    let lat = rider.location?.lat ? parseFloat(rider.location.lat) : AGF_CAFE_HUB.lat;
    let lng = rider.location?.lng ? parseFloat(rider.location.lng) : AGF_CAFE_HUB.lng;

    mapInstanceRef.current.setView([lat, lng], 16, { animate: true, duration: 0.8 });
    if (riderMarkersRef.current[rider.id]) {
      riderMarkersRef.current[rider.id].openPopup();
    }
  };

  // Metrics
  const totalRiders = staffList.length;
  const onDutyCount = staffList.filter(r => r.status === 'On Duty').length;
  const availableCount = staffList.filter(r => r.status === 'Available' || !r.status).length;

  const filteredRiders = staffList.filter(r => {
    if (filterStatus === 'on_duty' && r.status !== 'On Duty') return false;
    if (filterStatus === 'available' && r.status !== 'Available') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (r.name || '').toLowerCase().includes(q) || (r.phone || '').includes(q);
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 text-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh]">
        
        {/* Top Control Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 border-b border-stone-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Fleet Control Radar ("God View")
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                  Live GPS
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Real-time tracking of all active delivery partners across 5 KM Baharagora Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-stone-950 px-3 py-1.5 rounded-2xl border border-stone-800 text-xs font-bold text-stone-300">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>5 KM Cafe Radius Active</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* HUD Counters */}
        <div className="bg-stone-950/90 border-b border-stone-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] text-stone-500 font-bold uppercase block">Total Fleet</span>
              <span className="text-sm font-black text-white">{totalRiders} Delivery Partners</span>
            </div>

            <div className="h-6 w-px bg-stone-800" />

            <div>
              <span className="text-[10px] text-amber-500 font-bold uppercase block">On Road Delivering</span>
              <span className="text-sm font-black text-amber-400">🟡 {onDutyCount} Riders</span>
            </div>

            <div className="h-6 w-px bg-stone-800" />

            <div>
              <span className="text-[10px] text-emerald-500 font-bold uppercase block">Available at Cafe</span>
              <span className="text-sm font-black text-emerald-400">🟢 {availableCount} Riders</span>
            </div>

            <div className="h-6 w-px bg-stone-800 hidden md:block" />

            <div className="hidden md:block">
              <span className="text-[10px] text-stone-500 font-bold uppercase block">Active Kitchen Orders</span>
              <span className="text-sm font-black text-stone-200">{activeOrders.length} Pipeline Orders</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-stone-900 p-1 rounded-xl border border-stone-800">
            {[
              { id: 'all', label: 'All Fleet' },
              { id: 'on_duty', label: 'On Duty (🟡)' },
              { id: 'available', label: 'Available (🟢)' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === f.id
                    ? 'bg-amber-400 text-stone-950 shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Master Body: Map + Rider Drawer */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Leaflet Master Map */}
          <div className="flex-1 h-full min-h-[350px] relative bg-stone-950">
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} className="w-full h-full" />

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none bg-stone-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-stone-800 text-[11px] font-bold text-stone-300 flex items-center gap-3 shadow-lg">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> ☕ Cafe Hub</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 🟢 Free Rider</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 🟡 On Duty</span>
            </div>
          </div>

          {/* Rider List Drawer */}
          <div className="w-full md:w-80 bg-stone-900 border-t md:border-t-0 md:border-l border-stone-800 flex flex-col max-h-[250px] md:max-h-full shrink-0">
            <div className="p-3 border-b border-stone-800">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search partner by name or phone..."
                  className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs font-bold text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {filteredRiders.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500">
                  No delivery riders found matching filter.
                </div>
              ) : (
                filteredRiders.map((rider) => {
                  const isSelected = selectedRider?.id === rider.id;
                  const status = rider.status || 'Available';
                  const isOnDuty = status === 'On Duty';

                  return (
                    <div
                      key={rider.id}
                      onClick={() => handleFocusRider(rider)}
                      className={`p-3 rounded-2xl border text-xs transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-400/50 shadow-md'
                          : 'bg-stone-950/60 border-stone-800/80 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isOnDuty ? 'bg-amber-400 text-stone-950' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          <Bike className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-white truncate text-xs">{rider.name || 'Delivery Partner'}</h4>
                          <p className="text-[10px] text-stone-400 truncate">{rider.phone || 'No Phone'}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isOnDuty 
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {status}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFocusRider(rider);
                          }}
                          className="block text-[10px] font-bold text-amber-400 hover:text-amber-300 mt-1"
                        >
                          Focus Pin 📍
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
