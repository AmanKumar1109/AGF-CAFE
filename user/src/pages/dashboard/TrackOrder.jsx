import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  Star, 
  Clock, 
  Package, 
  Check, 
  ClipboardList, 
  Home, 
  UtensilsCrossed, 
  Bike,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export const TrackOrder = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const unsub = onSnapshot(doc(db, 'orders', id), (docSnap) => {
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      } else {
        setOrder(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error listening to order:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (order && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from('.track-item', {
          x: -20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out'
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [order?.status]);

  const currentStatus = order?.status || 'Order Received';

  const getStatusStepIndex = (statusStr) => {
    switch (statusStr?.toLowerCase()) {
      case 'order received':
      case 'received':
      case 'pending':
        return 1;
      case 'preparing':
      case 'packed':
      case 'packing':
      case 'kitchen':
        return 2;
      case 'out for delivery':
      case 'dispatched':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStatusStepIndex(currentStatus);

  if (loading) {
    return (
      <div className="p-16 text-center text-stone-500 font-bold text-sm space-y-3">
        <UtensilsCrossed className="w-10 h-10 text-amber-500 animate-bounce mx-auto" />
        <p className="tracking-wide uppercase text-xs">Connecting to Kitchen Delivery Network...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center space-y-4 bg-white rounded-3xl border border-stone-200 shadow-sm">
        <p className="text-stone-700 font-bold">We couldn't find details for this order.</p>
        <Link to="/dashboard/orders" className="inline-flex px-6 py-2.5 bg-amber-400 text-stone-950 font-black rounded-xl text-xs uppercase shadow-sm">
          Back to Orders
        </Link>
      </div>
    );
  }

  const steps = [
    { step: 1, title: 'Order Received', desc: 'Order confirmed & synced with cafe kitchen', icon: ClipboardList },
    { step: 2, title: 'Preparing in Kitchen', desc: 'Chef preparing fresh dishes and hot brews', icon: UtensilsCrossed },
    { step: 3, title: 'Out for Delivery', desc: 'Express cafe delivery partner is on the way', icon: Bike },
    { step: 4, title: 'Delivered', desc: 'Fresh meal handed over at your doorstep', icon: Home }
  ];

  return (
    <div ref={containerRef} className="pb-24 lg:pb-8 space-y-6">
      <Link 
        to="/dashboard/orders" 
        className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 font-bold text-xs uppercase tracking-wider transition-colors px-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Orders</span>
      </Link>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Left Column: Vertical Timeline */}
        <div className="flex-1 w-full">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-8 pb-6 border-b border-stone-100">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-serif tracking-tight">
                  Order #{order?.id?.slice(0, 8)?.toUpperCase()}
                </h2>
                <p className="text-amber-700 font-bold text-xs mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{currentStatus === 'Delivered' ? 'Delivered successfully 🎉' : 'Express Cafe Doorstep Delivery 🛵'}</span>
                </p>
              </div>
              <span className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-full shadow-sm ${
                currentStatus === 'Delivered'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : currentStatus === 'Cancelled'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {currentStatus}
              </span>
            </div>

            {/* Stepper Timeline */}
            <div className="relative pt-2 pb-2 space-y-0">
              {/* Dashed Background Line */}
              <div className="absolute left-[1.5rem] sm:left-[2rem] top-8 bottom-12 w-0.5 border-l-2 border-dashed border-stone-200 z-0" />
              
              {/* Animated Progress Line */}
              <div
                className="absolute left-[1.5rem] sm:left-[2rem] top-8 w-0.5 bg-amber-500 z-0 transition-all duration-700"
                style={{ height: `${Math.min(100, ((currentStep - 1) / 3) * 100)}%`, width: '2px' }}
              />

              {steps.map((s, idx) => {
                const Icon = s.icon;
                const isActive = currentStep === s.step;
                const isCompleted = currentStep > s.step;
                const isFuture = currentStep < s.step;

                return (
                  <div 
                    key={s.step} 
                    className={`track-item relative z-10 flex items-start gap-4 sm:gap-6 ${
                      isFuture ? 'opacity-40 grayscale' : ''
                    } ${idx !== steps.length - 1 ? 'pb-10 sm:pb-12' : ''}`}
                  >
                    <div className="relative shrink-0">
                      <div className={`relative z-10 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-sm border-2 transition-all duration-300 ${
                        isActive 
                          ? 'bg-amber-400 text-stone-950 border-amber-400 scale-105 shadow-sm'
                          : isCompleted 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-stone-100 text-stone-400 border-stone-200'
                      }`}>
                        <Icon className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.2]" />
                        {isCompleted && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <Check className="w-3 h-3 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`flex-1 pt-1.5 sm:pt-3 transition-all duration-300 ${isActive ? 'translate-x-1' : ''}`}>
                      <h4 className={`font-black text-base sm:text-lg tracking-tight ${
                        isActive ? 'text-amber-800' : isCompleted ? 'text-emerald-700' : 'text-stone-400'
                      }`}>
                        {s.title}
                      </h4>
                      <p className="text-xs sm:text-sm font-medium text-stone-500 mt-1 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Rider Info & Destination Address */}
        <div className="w-full lg:w-80 space-y-5">
          {/* Rider Card */}
          <div className="track-item bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-stone-500 text-xs uppercase tracking-wider mb-4">
              Assigned Delivery Partner
            </h3>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 overflow-hidden border-2 border-amber-400 shadow-sm flex-shrink-0 flex items-center justify-center text-amber-600">
                <Bike className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-stone-900 text-base truncate">
                  {order?.assignedPartnerName || 'AGF Express Rider'}
                </h4>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-700 mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> 
                  <span>4.9 (500+ Cafe deliveries)</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              {order?.assignedPartnerPhone ? (
                <>
                  <a 
                    href={`tel:${order.assignedPartnerPhone}`} 
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
                  >
                    <Phone className="w-4 h-4 stroke-[2.5]" />
                    <span>Call</span>
                  </a>
                  <a 
                    href={`sms:${order.assignedPartnerPhone}`} 
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors border border-stone-200"
                  >
                    <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                    <span>SMS</span>
                  </a>
                </>
              ) : (
                <>
                  <button disabled className="flex-1 flex items-center justify-center gap-2 py-3 bg-stone-100 text-stone-400 font-bold text-xs rounded-xl cursor-not-allowed border border-stone-200">
                    <Phone className="w-4 h-4" />
                    <span>Call</span>
                  </button>
                  <button disabled className="flex-1 flex items-center justify-center gap-2 py-3 bg-stone-100 text-stone-400 font-bold text-xs rounded-xl cursor-not-allowed border border-stone-200">
                    <MessageSquare className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Delivery OTP Security Badge */}
          {order?.deliveryOtp && currentStatus !== 'Delivered' && (
            <div className="track-item bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-amber-800">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-black uppercase tracking-wider">Delivery PIN</span>
              </div>
              <div className="text-center py-3 bg-white border border-amber-300 rounded-2xl shadow-sm">
                <span className="text-2xl font-black font-mono tracking-[0.3em] text-amber-700">
                  {order.deliveryOtp}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 text-center font-medium">
                Share this PIN only with your delivery partner at handover
              </p>
            </div>
          )}

          {/* Delivery Destination Address */}
          {order?.shippingAddress && (
            <div className="track-item bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-black text-stone-500 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>Delivery Address</span>
              </h3>
              <p className="text-xs font-black text-stone-900">{order.shippingAddress.fullName || order.customerName}</p>
              <p className="text-xs text-stone-600 font-medium mt-1 leading-relaxed">
                {order.shippingAddress.street || order.shippingAddress.address}, {order.shippingAddress.locality || ''}
              </p>
              <p className="text-xs text-stone-500 font-medium">
                {order.shippingAddress.city} {order.shippingAddress.pincode}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
