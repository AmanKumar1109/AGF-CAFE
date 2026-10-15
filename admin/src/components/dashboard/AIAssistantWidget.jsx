import React, { useState, useRef } from 'react';
import { Maximize2, Sparkles, Mic, ArrowUp } from 'lucide-react';
import { useFloatingOrb } from '../../hooks/useGSAPAnimation';

export const AIAssistantWidget = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'How can I assist you with your store analytics today?' },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const orbRef = useRef(null);

  useFloatingOrb(orbRef);

  const handleSend = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userText = prompt.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setPrompt('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Analyzed "${userText}": Revenue is up +24.4% this period. Peak sales occur on Tuesdays with highest conversions on audio products!`,
        },
      ]);
    }, 1000);
  };

  return (
    <div className="gsap-card bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.015)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.035)] transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
          AI Assistant
        </h3>
        <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3D Orb Visual in Center */}
      <div className="relative py-6 flex flex-col items-center justify-center min-h-[140px]">
        {/* Subtle background ambient radial light */}
        <div className="absolute w-36 h-36 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* 3D Blue Sphere */}
        <div
          ref={orbRef}
          className="relative w-20 h-20 rounded-full cursor-pointer shadow-[0_15px_30px_rgba(37,99,235,0.35)] transition-transform duration-300 hover:scale-105"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, #93c5fd 0%, #3b82f6 40%, #1d4ed8 75%, #172554 100%)',
          }}
        >
          {/* Specular Glint Highlight */}
          <div
            className="absolute top-2 left-3 w-5 h-3 rounded-full blur-[1px] rotate-[-25deg]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 80%)',
            }}
          />
        </div>

        {/* Soft shadow below the floating ball */}
        <div className="w-16 h-3 bg-blue-900/15 rounded-full blur-md mt-4" />

        {/* Chat snippet notification if answered */}
        {messages.length > 1 && (
          <div className="mt-3 px-3 py-1.5 bg-blue-50/80 rounded-xl text-[11px] text-blue-800 text-center max-w-[260px] animate-fadeIn">
            {messages[messages.length - 1].text}
          </div>
        )}
      </div>

      {/* Bottom Interactive Chat Input matching the image */}
      <form
        onSubmit={handleSend}
        className="w-full flex items-center gap-2 bg-[#f4f6fa] hover:bg-[#edf1f8] focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 border border-slate-200/60 rounded-full py-1.5 pl-3 pr-1.5 transition-all"
      >
        <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={isTyping ? 'Thinking...' : 'Ask me anything...'}
          className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none flex-1 font-normal"
        />
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition cursor-pointer"
          title="Voice input"
        >
          <Mic className="w-3.5 h-3.5" />
        </button>
        <button
          type="submit"
          className="w-7 h-7 rounded-full bg-[#2563eb] hover:bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/30 transition-transform active:scale-95 cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
