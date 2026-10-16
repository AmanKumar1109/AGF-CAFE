import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  MessageSquareWarning,
  Clock,
  CheckCircle2,
  MessageCircle,
  Plus,
  RefreshCw,
  Package,
  XCircle,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyComplaints = () => {
  const { currentUser, userProfile } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const docsMap = new Map();
    let unsubUser = () => {};
    let unsubPhone = () => {};

    const updateState = () => {
      const allDocs = Array.from(docsMap.values());
      allDocs.sort((a, b) => {
        const timeA = a.createdAt?.toDate?.()?.getTime() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toDate?.()?.getTime() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      setComplaints(allDocs);
      setIsLoading(false);
    };

    try {
      // 1. Query by userId
      const qUser = query(
        collection(db, 'complaints'),
        where('userId', '==', currentUser.uid)
      );

      unsubUser = onSnapshot(
        qUser,
        (snap) => {
          snap.docs.forEach((doc) => {
            docsMap.set(doc.id, { id: doc.id, ...doc.data() });
          });
          updateState();
        },
        (err) => {
          console.warn('Complaints user query error:', err);
          setIsLoading(false);
        }
      );

      // 2. Query by phone if user has phone number set
      if (userProfile?.phone) {
        const qPhone = query(
          collection(db, 'complaints'),
          where('phone', '==', userProfile.phone)
        );

        unsubPhone = onSnapshot(
          qPhone,
          (snap) => {
            snap.docs.forEach((doc) => {
              docsMap.set(doc.id, { id: doc.id, ...doc.data() });
            });
            updateState();
          },
          (err) => {
            console.warn('Complaints phone query error:', err);
          }
        );
      } else {
        setTimeout(updateState, 300);
      }
    } catch (err) {
      console.warn('Complaints setup error:', err);
      setIsLoading(false);
    }

    return () => {
      unsubUser();
      unsubPhone();
    };
  }, [currentUser, userProfile?.phone]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-stone-100 border border-stone-200 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight font-serif">
            My Complaints & Support
          </h1>
          <p className="text-stone-600 font-medium text-xs sm:text-sm mt-1">
            Track resolution status, kitchen investigations, and manager replies
          </p>
        </div>

        <Link
          to="/complaint"
          className="self-start sm:self-auto px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-sm transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Ticket</span>
        </Link>
      </div>

      {/* Complaints List */}
      {complaints.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <MessageSquareWarning className="w-8 h-8 stroke-[1.8]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-stone-900 mb-1">No Support Tickets Yet</h2>
            <p className="text-xs font-semibold text-stone-600 max-w-sm mx-auto leading-relaxed">
              Facing cold food, delayed delivery, or missing beverages? Lodge a complaint anytime and our cafe management team will make it right.
            </p>
          </div>
          <Link
            to="/complaint"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300 font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Lodge a Complaint</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((comp) => {
            const ticketDisplayId = comp.ticketId || `TKT-${comp.id.slice(0, 6).toUpperCase()}`;
            const isResolved = comp.status === 'resolved';
            const isInProgress = comp.status === 'in_progress';
            const isDismissed = comp.status === 'dismissed';

            return (
              <div
                key={comp.id}
                className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm relative overflow-hidden transition hover:border-stone-300"
              >
                {/* Status indicator side stripe */}
                <div
                  className={`absolute top-0 left-0 w-1.5 h-full ${
                    isResolved
                      ? 'bg-emerald-500'
                      : isInProgress
                      ? 'bg-blue-500'
                      : isDismissed
                      ? 'bg-stone-400'
                      : 'bg-amber-400'
                  }`}
                />

                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-2">
                    {/* Ticket Header & Date */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black bg-stone-100 text-stone-800 px-2.5 py-1 rounded-md tracking-wider uppercase font-mono border border-stone-200">
                        {ticketDisplayId}
                      </span>

                      {comp.orderId && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          <span>Order #{comp.orderId}</span>
                        </span>
                      )}

                      <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        {comp.createdAt?.toDate
                          ? comp.createdAt.toDate().toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recently'}
                      </span>
                    </div>

                    {/* Category Title */}
                    <h3 className="text-base font-black text-stone-900 font-serif tracking-tight">
                      {comp.issueType || 'General Cafe Inquiry'}
                    </h3>

                    {/* Description */}
                    <p className="text-xs font-medium text-stone-700 leading-relaxed max-w-xl bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                      "{comp.description}"
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 self-start sm:self-center">
                    {isResolved ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 text-xs font-black uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Resolved</span>
                      </div>
                    ) : isInProgress ? (
                      <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200 text-xs font-black uppercase tracking-wider">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Investigating</span>
                      </div>
                    ) : isDismissed ? (
                      <div className="flex items-center gap-1.5 text-stone-600 bg-stone-100 px-3.5 py-1.5 rounded-full border border-stone-200 text-xs font-black uppercase tracking-wider">
                        <XCircle className="w-4 h-4" />
                        <span>Closed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200 text-xs font-black uppercase tracking-wider">
                        <Clock className="w-4 h-4" />
                        <span>Pending Review</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manager Official Response Box */}
                {comp.adminReply && (
                  <div className="mt-5 p-4 sm:p-5 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex gap-3.5 animate-in fade-in">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-wider">
                          Official Response from Cafe Manager
                        </h4>
                        <span className="text-[10px] text-stone-500 font-semibold">• AGF Cafe Hospitality Team</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-stone-800 leading-relaxed">
                        {comp.adminReply}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
