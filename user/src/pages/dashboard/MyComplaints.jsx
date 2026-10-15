import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  MessageSquareWarning, 
  Clock, 
  CheckCircle2, 
  MessageCircle,
  Plus
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

    const q = query(
      collection(db, 'complaints'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toDate?.()?.getTime() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toDate?.()?.getTime() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      setComplaints(docs);
      setIsLoading(false);
    }, (err) => {
      console.warn("Complaints listener error:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-stone-900/50 border border-white/5 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-serif">
            My Complaints
          </h1>
          <p className="text-stone-400 font-medium text-xs sm:text-sm mt-1">
            Track resolution status and manager replies for reported issues
          </p>
        </div>
        
        <Link 
          to="/complaint"
          className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Ticket</span>
        </Link>
      </div>

      {complaints.length === 0 ? (
        <div className="bg-stone-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquareWarning className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h2 className="text-lg font-black text-white mb-1.5">No Complaints Filed</h2>
          <p className="text-xs font-semibold text-stone-400 max-w-sm mx-auto leading-relaxed">
            Everything smooth? If you ever encounter food quality, missing beverages, or delivery delays, report it immediately.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(comp => (
            <div 
              key={comp.id} 
              className="bg-stone-900/70 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full ${
                comp.status === 'resolved' ? 'bg-emerald-500' : 'bg-amber-400'
              }`} />
              
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black bg-stone-800 text-amber-400 px-2.5 py-1 rounded-md tracking-wider uppercase font-mono border border-white/5">
                      TICKET #{comp.id.slice(0, 6)?.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-stone-400">
                      {comp.createdAt?.toDate ? comp.createdAt.toDate().toLocaleDateString('en-IN') : 'Recently'}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mb-1">
                    {comp.issueType || 'General Cafe Inquiry'}
                  </h3>
                  <p className="text-xs font-semibold text-stone-300 leading-relaxed max-w-xl">
                    "{comp.description}"
                  </p>
                </div>
                
                <div className="flex items-center sm:items-start shrink-0">
                  {comp.status === 'resolved' ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/30 text-xs font-black uppercase">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Resolved</span>
                    </div>
                  ) : comp.status === 'in_progress' ? (
                    <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-3.5 py-1.5 rounded-full border border-blue-500/30 text-xs font-black uppercase">
                      <MessageCircle className="w-4 h-4 animate-pulse" />
                      <span>In Progress</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/30 text-xs font-black uppercase">
                      <Clock className="w-4 h-4" />
                      <span>Pending Review</span>
                    </div>
                  )}
                </div>
              </div>

              {comp.adminReply && (
                <div className="mt-5 p-4 bg-stone-800/80 rounded-2xl border border-amber-500/20 flex gap-3.5">
                  <div className="shrink-0 mt-0.5">
                    <MessageCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">
                      Response From Cafe Manager
                    </h4>
                    <p className="text-xs font-medium text-stone-200 leading-relaxed">
                      {comp.adminReply}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
