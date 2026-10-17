import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Search,
  Navigation,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Building,
  Home,
  Briefcase,
  FileText,
  Clock,
  Sparkles,
  Phone,
  BellOff,
  DoorClosed
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { loadGoogleMaps } from '../../utils/googleMapsLoader';
import { AGF_CAFE_HUB, checkDeliveryServiceable, calculateETA } from '../../utils/locationUtils';
import { fetchRoadRoute } from '../../utils/routeService';
import { useDeliveryRadius } from '../../hooks/useDeliveryRadius';

export default function LocationPickerModal({ isOpen, onClose, onConfirm, initialLocation }) {
  const deliveryRadius = useDeliveryRadius();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geofenceCircleRef = useRef(null);
  const geofenceOuterCircleRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const geocoderRef = useRef(null);

  // Selected Pin Coordinates
  const [coords, setCoords] = useState(
    initialLocation?.lat && initialLocation?.lng
      ? { lat: parseFloat(initialLocation.lat), lng: parseFloat(initialLocation.lng) }
      : { lat: AGF_CAFE_HUB.lat, lng: AGF_CAFE_HUB.lng }
  );

  // GPS Acquisition State
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'acquiring' | 'success' | 'error'
  const [gpsError, setGpsError] = useState('');

  // Address Details State
  const [formattedAddress, setFormattedAddress] = useState(initialLocation?.formattedAddress || '');
  const [city, setCity] = useState(initialLocation?.city || 'Baharagora');
  const [state, setState] = useState(initialLocation?.state || 'Jharkhand');
  const [postalCode, setPostalCode] = useState(initialLocation?.pincode || '832101');
  const [country, setCountry] = useState(initialLocation?.country || 'India');

  const [addressDetails, setAddressDetails] = useState({
    houseNo: initialLocation?.houseNo || '',
    street: initialLocation?.street || '',
    landmark: initialLocation?.landmark || '',
    deliveryInstructions: initialLocation?.deliveryInstructions || '',
    type: initialLocation?.type || 'Home'
  });

  // Search Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const searchDebounceRef = useRef(null);

  // Map interaction
  const [isMapDragging, setIsMapDragging] = useState(false);
  const isProgrammaticMoveRef = useRef(false);

  // Dynamic Serviceability (Straight-Line Radius zone check)
  const serviceability = checkDeliveryServiceable(coords.lat, coords.lng, AGF_CAFE_HUB, deliveryRadius);
  const [roadDistanceKm, setRoadDistanceKm] = useState(null);
  const [roadDurationMins, setRoadDurationMins] = useState(null);

  // Debounced road route fetch whenever coordinates change
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetchRoadRoute(AGF_CAFE_HUB, coords);
        if (active && res && res.totalDistanceKm > 0) {
          setRoadDistanceKm(res.totalDistanceKm);
          setRoadDurationMins(res.totalDurationMins);
        }
      } catch (e) {
        if (active) {
          const estimated = Math.round(serviceability.distanceKm * 1.25 * 10) / 10;
          setRoadDistanceKm(estimated);
        }
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [coords.lat, coords.lng, serviceability.distanceKm]);

  const currentETA = roadDurationMins ? `~${roadDurationMins} mins` : calculateETA(roadDistanceKm || serviceability.distanceKm);

  // Quick Baharagora Locality Area Jump Points
  const QUICK_BAHARAGORA_POINTS = [
    { name: 'Taliya', lat: 22.2475, lng: 86.7280 },
    { name: 'Baharagora Chowk', lat: 22.2785, lng: 86.7160 },
    { name: 'College Road', lat: 22.2842, lng: 86.7265 },
    { name: 'Hospital / CHC', lat: 22.2715, lng: 86.7118 },
    { name: 'Barasol (NH49)', lat: 22.2530, lng: 86.7050 },
    { name: 'Kaimi / Mauda', lat: 22.2435, lng: 86.7150 },
    { name: 'AGF Cafe Hub', lat: AGF_CAFE_HUB.lat, lng: AGF_CAFE_HUB.lng },
  ];

  const handleSelectQuickPoint = (point) => {
    isProgrammaticMoveRef.current = true;
    setCoords({ lat: point.lat, lng: point.lng });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([point.lat, point.lng], 16, { animate: true, duration: 0.6 });
    }
    reverseGeocode(point.lat, point.lng);
  };

  // Quick Delivery Instruction Chips
  const instructionChips = [
    { label: "Don't ring bell (Baby sleeping)", icon: BellOff },
    { label: "Leave at door / security", icon: DoorClosed },
    { label: "Call upon arrival", icon: Phone }
  ];

  // Load Google Maps SDK for Places & Geocoding if available
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    loadGoogleMaps().then(maps => {
      if (!active) return;
      if (!autocompleteServiceRef.current && maps.places) {
        autocompleteServiceRef.current = new maps.places.AutocompleteService();
      }
      if (!geocoderRef.current) {
        geocoderRef.current = new maps.Geocoder();
      }
    }).catch(() => {
      // Free open Nominatim fallback will be used
    });
    return () => { active = false; };
  }, [isOpen]);

  // Reverse Geocoding with Fallback
  const reverseGeocode = useCallback(async (lat, lng) => {
    setIsGeocoding(true);

    // 1. Try Google Geocoder
    if (geocoderRef.current) {
      geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
        setIsGeocoding(false);
        if (status === 'OK' && results[0]) {
          const first = results[0];
          setFormattedAddress(first.formatted_address);

          let parsedCity = '';
          let parsedState = 'Jharkhand';
          let parsedPincode = '';
          let streetParts = [];
          let detectedLandmark = '';

          (first.address_components || []).forEach(comp => {
            const types = comp.types || [];
            if (types.includes('locality')) parsedCity = comp.long_name;
            else if (types.includes('administrative_area_level_1')) parsedState = comp.long_name;
            else if (types.includes('postal_code')) parsedPincode = comp.long_name;
            if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood') || types.includes('point_of_interest')) {
              detectedLandmark = comp.long_name;
            }
            if (types.includes('route') || types.includes('street_number') || types.includes('sublocality_level_2')) {
              streetParts.push(comp.long_name);
            }
          });

          if (parsedCity) setCity(parsedCity);
          if (parsedState) setState(parsedState);
          if (parsedPincode) setPostalCode(parsedPincode);
          setAddressDetails(prev => ({
            ...prev,
            street: streetParts.join(', ') || prev.street,
            landmark: detectedLandmark || prev.landmark
          }));
          return;
        }
      });
      return;
    }

    // 2. OpenStreetMap Nominatim Fallback
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const detectedStreet = [addr.house_number, addr.road, addr.building, addr.suburb].filter(Boolean).join(', ');
          const detectedLocality = [addr.neighbourhood, addr.residential, addr.commercial].filter(Boolean).join(', ');
          const detectedCity = addr.city || addr.town || addr.village || addr.county || 'Baharagora';
          const detectedPincode = addr.postcode || '832101';

          setFormattedAddress(data.display_name || '');
          if (detectedCity) setCity(detectedCity);
          if (detectedPincode) setPostalCode(detectedPincode);
          setAddressDetails(prev => ({
            ...prev,
            street: detectedStreet || prev.street,
            landmark: detectedLocality || prev.landmark
          }));
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Request High-Accuracy GPS
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setGpsStatus('error');
      return;
    }

    setGpsStatus('acquiring');
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1000000) / 1000000;
        const lng = Math.round(pos.coords.longitude * 1000000) / 1000000;
        isProgrammaticMoveRef.current = true;
        setCoords({ lat, lng });
        setGpsStatus('success');
        reverseGeocode(lat, lng);
      },
      (err) => {
        setGpsStatus('error');
        let errorMsg = 'Could not fetch your location. Please drag pin manually on map.';
        if (err.code === 1) {
          errorMsg = '🔒 Location permission denied. Please allow location access in your browser address bar.';
        } else if (err.code === 2) {
          errorMsg = '📡 GPS signal unavailable. Please ensure location/GPS is turned ON on your phone/device.';
        } else if (err.code === 3) {
          errorMsg = '⏱️ Location request timed out. Please drag the pin on map to your doorstep.';
        }
        setGpsError(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Initialize and center map properly: use initialLocation if valid, or default to AGF Cafe Hub
  useEffect(() => {
    if (isOpen) {
      if (initialLocation && initialLocation.lat && initialLocation.lng && !isNaN(parseFloat(initialLocation.lat))) {
        const parsed = {
          lat: parseFloat(initialLocation.lat),
          lng: parseFloat(initialLocation.lng)
        };
        isProgrammaticMoveRef.current = true;
        setCoords(parsed);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([parsed.lat, parsed.lng], 16);
        }
      } else {
        isProgrammaticMoveRef.current = true;
        setCoords({ lat: AGF_CAFE_HUB.lat, lng: AGF_CAFE_HUB.lng });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], 15);
        }
      }

      if (initialLocation) {
        setAddressDetails({
          houseNo: initialLocation.houseNo || '',
          street: initialLocation.street || initialLocation.address || '',
          landmark: initialLocation.landmark || initialLocation.locality || '',
          deliveryInstructions: initialLocation.deliveryInstructions || '',
          type: initialLocation.type || 'Home'
        });
        if (initialLocation.city) setCity(initialLocation.city);
        if (initialLocation.pincode) setPostalCode(initialLocation.pincode);
        if (initialLocation.formattedAddress) setFormattedAddress(initialLocation.formattedAddress);
      }
    }
  }, [isOpen, initialLocation?.lat, initialLocation?.lng]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 15,
      zoomControl: true
    });
    mapInstanceRef.current = map;

    // Google Maps Roadmap Tiles
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }).addTo(map);

    // Dynamic Geofence Delivery Radius Circle
    const isServiceable = serviceability.isServiceable;
    const innerCircle = L.circle([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], {
      radius: deliveryRadius * 1000,
      color: isServiceable ? '#10b981' : '#f43f5e',
      fillColor: isServiceable ? '#10b981' : '#f43f5e',
      fillOpacity: isServiceable ? 0.08 : 0.16,
      weight: 3
    }).addTo(map);
    geofenceCircleRef.current = innerCircle;

    // Glowing Dash Border
    const outerCircle = L.circle([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], {
      radius: deliveryRadius * 1000,
      color: '#f59e0b',
      fillOpacity: 0,
      weight: 1.5,
      dashArray: '5, 8'
    }).addTo(map);
    geofenceOuterCircleRef.current = outerCircle;

    // Cafe Store Marker
    const cafeIcon = L.divIcon({
      className: 'custom-cafe-hub-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border: 3px solid white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.45);
        ">
          <span style="font-size: 18px;">☕</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const storeMarker = L.marker([AGF_CAFE_HUB.lat, AGF_CAFE_HUB.lng], { icon: cafeIcon }).addTo(map);
    storeMarker.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px; text-align: center;">
        <strong style="color: #d97706; font-size: 13px;">☕ ${AGF_CAFE_HUB.name}</strong>
        <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">${AGF_CAFE_HUB.address}</p>
        <span style="display: inline-block; margin-top: 4px; padding: 2px 8px; background: #ecfdf5; color: #047857; font-weight: bold; border-radius: 9999px; font-size: 10px;">
          ${deliveryRadius} KM Fresh Delivery Origin
        </span>
      </div>
    `);

    // Center pin drag events (Zomato style)
    map.on('movestart', () => {
      setIsMapDragging(true);
    });

    map.on('moveend', () => {
      setIsMapDragging(false);
      const center = map.getCenter();
      const newLat = Math.round(center.lat * 1000000) / 1000000;
      const newLng = Math.round(center.lng * 1000000) / 1000000;

      if (!isProgrammaticMoveRef.current) {
        setCoords({ lat: newLat, lng: newLng });
        reverseGeocode(newLat, newLng);
      }
      isProgrammaticMoveRef.current = false;
    });

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      geofenceCircleRef.current = null;
      geofenceOuterCircleRef.current = null;
    };
  }, [isOpen]);

  // Dynamically update geofence circles if admin changes radius live
  useEffect(() => {
    if (geofenceCircleRef.current && deliveryRadius) {
      geofenceCircleRef.current.setRadius(deliveryRadius * 1000);
    }
    if (geofenceOuterCircleRef.current && deliveryRadius) {
      geofenceOuterCircleRef.current.setRadius(deliveryRadius * 1000);
    }
  }, [deliveryRadius]);

  // Sync map center when coords change programmatically (GPS / Search)
  useEffect(() => {
    if (mapInstanceRef.current && isProgrammaticMoveRef.current) {
      mapInstanceRef.current.setView([coords.lat, coords.lng], 16, { animate: true, duration: 0.8 });
    }
  }, [coords]);

  // Autocomplete Search Debounce
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!val.trim() || val.length < 3) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(() => {
      if (autocompleteServiceRef.current && window.google?.maps?.Circle) {
        const circle = new window.google.maps.Circle({
          center: { lat: AGF_CAFE_HUB.lat, lng: AGF_CAFE_HUB.lng },
          radius: 20000 // 20 km search radius biased to Baharagora
        });

        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: val,
            componentRestrictions: { country: 'in' },
            bounds: circle.getBounds()
          },
          (results, status) => {
            setIsSearching(false);
            if (status === 'OK' && results) {
              setPredictions(results);
            } else {
              setPredictions([]);
            }
          }
        );
      } else {
        // Fallback search via Nominatim
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val + ', Baharagora')}&countrycodes=in&limit=5`)
          .then(res => res.json())
          .then(data => {
            setIsSearching(false);
            if (Array.isArray(data)) {
              setPredictions(data.map(item => ({
                place_id: item.place_id,
                description: item.display_name,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon)
              })));
            }
          })
          .catch(() => setIsSearching(false));
      }
    }, 350);
  };

  const handleSelectPrediction = (p) => {
    setSearchQuery(p.structured_formatting?.main_text || p.description);
    setPredictions([]);

    if (p.lat && p.lon) {
      isProgrammaticMoveRef.current = true;
      setCoords({ lat: p.lat, lng: p.lon });
      reverseGeocode(p.lat, p.lon);
      return;
    }

    if (geocoderRef.current && p.place_id) {
      geocoderRef.current.geocode({ placeId: p.place_id }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          const lat = Math.round(loc.lat() * 1000000) / 1000000;
          const lng = Math.round(loc.lng() * 1000000) / 1000000;
          isProgrammaticMoveRef.current = true;
          setCoords({ lat, lng });
          reverseGeocode(lat, lng);
        }
      });
    }
  };

  const handleAddInstructionChip = (text) => {
    setAddressDetails(prev => {
      const current = prev.deliveryInstructions || '';
      if (current.includes(text)) return prev;
      return {
        ...prev,
        deliveryInstructions: current ? `${current}, ${text}` : text
      };
    });
  };

  const handleConfirm = () => {
    const combinedStreet = [
      addressDetails.houseNo ? `Flat/House ${addressDetails.houseNo}` : '',
      addressDetails.street,
      addressDetails.landmark ? `Near ${addressDetails.landmark}` : ''
    ].filter(Boolean).join(', ') || formattedAddress.split(',')[0] || 'Delivery Address';

    const payload = {
      lat: coords.lat,
      lng: coords.lng,
      houseNo: addressDetails.houseNo,
      street: addressDetails.street || combinedStreet,
      locality: addressDetails.landmark || '',
      landmark: addressDetails.landmark || '',
      city: city || 'Baharagora',
      state: state || 'Jharkhand',
      pincode: postalCode || '832101',
      formattedAddress: formattedAddress,
      deliveryInstructions: addressDetails.deliveryInstructions || '',
      type: addressDetails.type || 'Home',
      distanceKm: roadDistanceKm || Math.round(serviceability.distanceKm * 1.25 * 10) / 10,
      roadDistanceKm: roadDistanceKm || Math.round(serviceability.distanceKm * 1.25 * 10) / 10,
      aerialDistanceKm: serviceability.distanceKm,
      isServiceable: serviceability.isServiceable,
      eta: currentETA
    };

    onConfirm(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-950/75 backdrop-blur-sm z-[2000] flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] my-auto">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 text-white flex items-center justify-between gap-3 shrink-0 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
              <MapPin className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Pinpoint Exact Delivery Location</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                  {deliveryRadius} KM Radius
                </span>
              </h2>
              <p className="text-xs text-stone-400">Drag map to pin your entrance for hot & fresh delivery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">

          {/* Search + GPS Auto-Detect Button */}
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search area, society, street or Baharagora landmark..."
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm font-bold text-stone-900 focus:outline-none focus:ring-4 focus:ring-amber-400/20 focus:border-amber-400 transition-all"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent" />
                </div>
              )}
            </div>

            {/* Predictions List */}
            {predictions.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden max-h-48 overflow-y-auto z-10 divide-y divide-stone-100">
                {predictions.map((p, idx) => (
                  <div
                    key={p.place_id || idx}
                    onClick={() => handleSelectPrediction(p)}
                    className="p-3 hover:bg-amber-50/80 cursor-pointer flex items-start gap-2.5 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-stone-900">{p.structured_formatting?.main_text || p.description}</p>
                      <p className="text-[11px] font-medium text-stone-500 line-clamp-1">{p.structured_formatting?.secondary_text || p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* "Use My Current Location" GPS Action */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleRequestLocation}
                disabled={gpsStatus === 'acquiring'}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Navigation className={`w-4 h-4 text-amber-600 ${gpsStatus === 'acquiring' ? 'animate-spin' : ''}`} />
                <span>{gpsStatus === 'acquiring' ? 'Locating High-Accuracy GPS...' : 'Use My Current Location (1-Tap GPS)'}</span>
              </button>
            </div>

            {gpsStatus === 'error' && gpsError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{gpsError}</span>
              </div>
            )}

            {/* Quick Baharagora Locality Jump Chips */}
            <div className="pt-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block mb-1.5">
                ⚡ Quick 1-Tap Neighborhood Pins:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_BAHARAGORA_POINTS.map((point, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectQuickPoint(point)}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-800 text-[11px] font-black rounded-xl border border-stone-200 transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                  >
                    <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{point.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Leaflet Map with Center Pin (Zomato Style) */}
          <div className="relative rounded-3xl overflow-hidden border border-stone-200 shadow-inner bg-stone-950">
            <div
              ref={mapContainerRef}
              style={{ width: '100%', height: '280px', minHeight: '280px', zIndex: 1 }}
              className="w-full h-full"
            />

            {/* Central Animated Floating Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none flex flex-col items-center justify-end h-16 w-16">
              <div className={`relative flex flex-col items-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isMapDragging ? '-translate-y-4' : 'translate-y-0'}`}>
                <div className={`flex items-center justify-center w-11 h-11 rounded-full border-4 shadow-xl transition-colors duration-300 ${
                  serviceability.isServiceable 
                    ? 'bg-emerald-500 border-white text-white shadow-emerald-500/50' 
                    : 'bg-rose-500 border-white text-white shadow-rose-500/50'
                }`}>
                  <MapPin className="w-5 h-5 fill-current" />
                </div>
                <div className={`w-1.5 h-3 ${serviceability.isServiceable ? 'bg-emerald-500' : 'bg-rose-500'} -mt-1 rounded-b-full transition-colors duration-300`} />
              </div>
              <div className={`absolute bottom-0 w-4 h-1.5 bg-black/40 rounded-full blur-[1px] transition-all duration-300 ${isMapDragging ? 'scale-75 opacity-20' : 'scale-100 opacity-50'}`} />
            </div>

            {/* Live 10 KM Serviceability Status Badge Overlay */}
            <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between gap-2 pointer-events-none">
              {serviceability.isServiceable ? (
                <div className="bg-emerald-600/95 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg border border-emerald-400/40">
                  <ShieldCheck className="w-4 h-4" />
                  <span>🟢 Delivery Available (~{roadDistanceKm ? `${roadDistanceKm} km Road` : `${serviceability.distanceKm} km`} • {currentETA})</span>
                </div>
              ) : (
                <div className="bg-rose-600/95 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg border border-rose-400/40 animate-pulse">
                  <AlertTriangle className="w-4 h-4" />
                  <span>🔴 Outside {deliveryRadius} KM Zone ({serviceability.distanceKm} km away)</span>
                </div>
              )}

              {isGeocoding && (
                <div className="bg-stone-900/90 text-stone-200 px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-md flex items-center gap-1.5">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-amber-400 border-t-transparent" />
                  <span>Pinning Address...</span>
                </div>
              )}
            </div>
          </div>

          {/* Formatted Address Preview */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Selected Map Point</span>
            <p className="text-xs font-black text-stone-800 line-clamp-2">
              {formattedAddress || 'Move the map or click GPS to select exact location'}
            </p>
            <div className="flex items-center gap-4 text-[11px] font-bold text-stone-500 pt-1">
              <span>📍 Lat: {coords.lat}</span>
              <span>•</span>
              <span>Lng: {coords.lng}</span>
            </div>
          </div>

          {/* Detailed Address Fields */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">House / Flat / Floor No.</label>
                <input
                  type="text"
                  value={addressDetails.houseNo}
                  onChange={(e) => setAddressDetails({ ...addressDetails, houseNo: e.target.value })}
                  placeholder="e.g. Flat 302, 3rd Floor"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">Street / Building / Area</label>
                <input
                  type="text"
                  value={addressDetails.street}
                  onChange={(e) => setAddressDetails({ ...addressDetails, street: e.target.value })}
                  placeholder="e.g. Station Road, Near Shitla Mandir"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1">Prominent Landmark (Helps rider find you fast)</label>
              <input
                type="text"
                value={addressDetails.landmark}
                onChange={(e) => setAddressDetails({ ...addressDetails, landmark: e.target.value })}
                placeholder="e.g. Opp. City Hospital, Yellow Gate"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Quick Delivery Instructions Chips */}
            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1.5">Rider Delivery Notes (Quick Chips)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {instructionChips.map((chip, idx) => {
                  const Icon = chip.icon;
                  const isSelected = (addressDetails.deliveryInstructions || '').includes(chip.label);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddInstructionChip(chip.label)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isSelected 
                          ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-xs' 
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={addressDetails.deliveryInstructions}
                onChange={(e) => setAddressDetails({ ...addressDetails, deliveryInstructions: e.target.value })}
                placeholder="Special notes for delivery partner..."
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Address Type Selector */}
            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1.5">Save Address As</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Home', icon: Home, label: 'Home' },
                  { id: 'Work', icon: Briefcase, label: 'Work' },
                  { id: 'Other', icon: MapPin, label: 'Other' }
                ].map(type => {
                  const Icon = type.icon;
                  const active = addressDetails.type === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setAddressDetails({ ...addressDetails, type: type.id })}
                      className={`py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        active 
                          ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-xs' 
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Confirmation */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="w-full sm:w-auto">
            {serviceability.isServiceable ? (
              <p className="text-xs font-black text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Within {deliveryRadius} KM Zone (~{roadDistanceKm ? `${roadDistanceKm} km Road` : `${serviceability.distanceKm} km`} • {currentETA})</span>
              </p>
            ) : (
              <p className="text-xs font-black text-rose-600 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Location exceeds {deliveryRadius} KM cafe delivery zone</span>
              </p>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 font-black text-xs uppercase tracking-wider border border-stone-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!serviceability.isServiceable}
              className={`flex-1 sm:flex-none px-7 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                serviceability.isServiceable
                  ? 'bg-amber-400 hover:bg-amber-500 text-stone-950 shadow-amber-400/30'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
