import React, { useState, useRef } from 'react';
import { Sparkles, ArrowUp, Coffee, Bike, ShoppingBag, TrendingUp } from 'lucide-react';
import { useFloatingOrb } from '../../hooks/useGSAPAnimation';

export const AIAssistantWidget = ({
  todayRevenue = 0,
  activeOrdersCount = 0,
  topDishName = 'Margherita Pizza',
  availableFleetCount = 0,
  aov = 340,
}) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { 
      sender: 'ai', 
      text: `Hello Chef! I am your AGF-CAFE AI Intelligence Assistant. Today's live sales stand at ₹${Number(todayRevenue || 0).toLocaleString('en-IN')}, with ${activeOrdersCount} kitchen orders in progress.` 
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const orbRef = useRef(null);

  useFloatingOrb(orbRef);

  const generateAnswer = (userText) => {
    const q = userText.toLowerCase();
    if (q.includes('sale') || q.includes('revenue') || q.includes('earning') || q.includes('today')) {
      return `Today's revenue is ₹${Number(todayRevenue || 0).toLocaleString('en-IN')} with an Average Order Value of ₹${aov}. Online and counter orders are actively syncing.`;
    }
    if (q.includes('order') || q.includes('kitchen') || q.includes('active')) {
      return `There are currently ${activeOrdersCount} active orders requiring preparation or dispatch.`;
    }
    if (q.includes('dish') || q.includes('best') || q.includes('food') || q.includes('popular')) {
      return `Your top performing item is "${topDishName}". It leads today's orders in customer demand!`;
    }
    if (q.includes('rider') || q.includes('fleet') || q.includes('delivery')) {
      return `Your fleet has ${availableFleetCount} delivery partner(s) marked Available and ready for dispatch.`;
    }
    return `Based on live cafe telemetry: Total revenue is healthy, ${activeOrdersCount} orders in kitchen, and average basket size is ₹${aov}.`;
  };

  const handleSend = (textToSend) => {
    const text = textToSend || prompt;
    if (!text || !text.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text: text.trim() }]);
    setPrompt('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: generateAnswer(text),
        },
      ]);
    }, 600);
  };

  return (
    <div className="gsap-card bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight font-serif">
              Cafe AI Intelligence
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Real-time operational insights</p>
          </div>
        </div>
      </div>

      {/* Floating 3D Amber Sphere Visual */}
      <div className="relative py-3 flex flex-col items-center justify-center">
        <div className="absolute w-28 h-28 bg-amber-400/15 rounded-full blur-xl pointer-events-none" />
        <div
          ref={orbRef}
          className="relative w-16 h-16 rounded-full cursor-pointer shadow-[0_12px_24px_rgba(245,158,11,0.3)] transition-transform duration-300 hover:scale-105"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, #fde68a 0%, #f59e0b 45%, #b45309 80%, #78350f 100%)',
          }}
        />
      </div>

      {/* Chat Messages Log */}
      <div className="max-h-36 overflow-y-auto space-y-2 pr-1 text-xs">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2.5 rounded-2xl ${
              msg.sender === 'user'
                ? 'bg-amber-500 text-stone-950 font-bold ml-6 text-right'
                : 'bg-slate-50 border border-slate-100 text-slate-700 font-medium mr-4'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div className="p-2 bg-slate-50 text-slate-400 text-[11px] rounded-xl flex items-center gap-1.5 italic">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
            Analyzing store metrics...
          </div>
        )}
      </div>

      {/* Quick Prompt Pills */}
      <div className="flex flex-wrap gap-1.5">
        {[
          'Today sales?',
          'Kitchen orders?',
          'Top selling dish?',
          'Fleet status?',
        ].map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-600 transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative"
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask AI about sales, fleet, orders..."
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-3.5 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={!prompt.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 flex items-center justify-center transition-all cursor-pointer disabled:opacity-30"
        >
          <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
};
