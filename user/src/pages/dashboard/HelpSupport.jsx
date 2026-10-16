import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  MessageCircle,
  PhoneCall,
  AlertCircle,
  Mail,
  Clock,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  UtensilsCrossed
} from 'lucide-react';

export const HelpSupport = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const whatsappNumber = '916207462800';
  const displayPhone = '+91 6207462800';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello AGF CAFE! I need assistance with my food order.')}`;

  const faqs = [
    {
      question: 'How long does AGF CAFE take to prepare and deliver?',
      answer: 'Most hot meals and beverages are freshly prepared within 15-20 minutes, with express delivery to your doorstep within 30-40 minutes depending on your location.'
    },
    {
      question: 'Can I cancel an order after placing it?',
      answer: 'Yes! You can cancel your order within 5 minutes of placing it directly from "My Orders". After 5 minutes, our kitchen starts preparing your fresh meal and cancellation is automatically locked.'
    },
    {
      question: 'What if an item is missing or unsatisfactory?',
      answer: 'We maintain the highest food quality standards. If anything is missing or not up to standard, click "Lodge a Complaint" or message us on WhatsApp with photos for instant replacement or refund.'
    },
    {
      question: 'How do refunds work for online cancelled orders?',
      answer: 'Refunds for online UPI / Card transactions are initiated instantly and credited back to your account within 24 to 48 banking hours.'
    },
    {
      question: 'What are the cafe kitchen operating hours?',
      answer: 'AGF CAFE kitchen is open 7 days a week from 8:00 AM to 11:00 PM IST.'
    }
  ];

  return (
    <div className="pb-24 lg:pb-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 sm:p-9 text-stone-900 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2.5">
          <span className="bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full inline-block mb-1">
            24/7 Guest Hospitality
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 font-serif">
            Help & Concierge Support
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm font-medium leading-relaxed">
            Have questions regarding delivery, custom dietary preferences, or catering? Reach out directly to our support desk.
          </p>
        </div>
      </div>

      {/* Support Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* WhatsApp Support Card */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between group hover:border-emerald-300 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center font-bold border border-emerald-200">
              <MessageCircle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Fastest Response
              </span>
              <h3 className="text-lg font-black text-stone-900 mt-1.5">Official WhatsApp Chat</h3>
            </div>
            <p className="text-stone-600 text-xs leading-relaxed">
              Connect directly with our customer desk on WhatsApp for instant order updates and special meal requests.
            </p>
            <p className="text-xs font-mono font-bold text-emerald-700">
              📱 {displayPhone}
            </p>
          </div>

          <div className="pt-6">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-5 bg-[#25D366] hover:bg-[#20bd5a] text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <span>Chat on WhatsApp</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </a>
          </div>
        </div>

        {/* Lodge a Complaint Card */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between group hover:border-amber-300 transition-all">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center font-bold border border-amber-200">
              <AlertCircle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Official Grievance
              </span>
              <h3 className="text-lg font-black text-stone-900 mt-1.5">Lodge a Formal Complaint</h3>
            </div>
            <p className="text-stone-600 text-xs leading-relaxed">
              Facing quality issues, missing food items, or delayed delivery? File a ticket directly to the cafe manager.
            </p>
          </div>

          <div className="pt-6">
            <Link
              to="/complaint"
              className="w-full py-3.5 px-5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <span>Lodge a Complaint</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </Link>
          </div>
        </div>

        {/* Direct Call Card */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center font-bold border border-blue-200">
              <PhoneCall className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-lg font-black text-stone-900">Direct Phone Call</h3>
            <p className="text-stone-600 text-xs leading-relaxed">
              Speak directly with our cafe captain for urgent address changes or immediate kitchen assistance.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-stone-600">
              <Clock className="w-4 h-4 text-blue-600" /> 
              <span>Daily: 8:00 AM – 11:00 PM</span>
            </div>
          </div>

          <div className="pt-6">
            <a
              href={`tel:${whatsappNumber}`}
              className="w-full py-3.5 px-5 bg-stone-100 hover:bg-stone-200 text-stone-900 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-stone-300 shadow-sm"
            >
              Call {displayPhone}
            </a>
          </div>
        </div>

        {/* Email Inquiry Card */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center font-bold border border-purple-200">
              <Mail className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-lg font-black text-stone-900">Email Inquiry</h3>
            <p className="text-stone-600 text-xs leading-relaxed">
              For party reservations, corporate catering, or vendor collaborations, send us an email.
            </p>
            <p className="text-xs font-mono font-bold text-stone-700">
              ✉️ support@theagfcafe.com
            </p>
          </div>

          <div className="pt-6">
            <a
              href="mailto:support@theagfcafe.com"
              className="w-full py-3.5 px-5 bg-stone-100 hover:bg-stone-200 text-stone-900 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-stone-300 shadow-sm"
            >
              Send Email
            </a>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-5">
        <div>
          <h3 className="text-lg font-black text-stone-900 tracking-tight">Frequently Asked Questions</h3>
          <p className="text-stone-500 text-xs mt-0.5">Quick answers to common questions about cafe orders and deliveries</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="border border-stone-200 rounded-2xl overflow-hidden transition-colors bg-stone-50"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left font-black text-stone-900 text-xs sm:text-sm flex items-center justify-between gap-4 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-amber-600 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-stone-600 leading-relaxed border-t border-stone-200 pt-3 bg-white">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
