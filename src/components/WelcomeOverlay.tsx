import React, { useState } from 'react';
import { ArrowRight, Sparkles, Compass, Eye, X } from 'lucide-react';

interface WelcomeOverlayProps {
  onExploreRoom01: () => void;
  isVisible: boolean;
}

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({
  onExploreRoom01,
  isVisible
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (!isVisible || dismissed) return null;

  return (
    <div className="pointer-events-none fixed top-24 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-lg animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="pointer-events-auto relative bg-neutral-950/80 border border-white/15 rounded-3xl p-6 sm:p-7 text-white shadow-2xl backdrop-blur-xl text-center">
        {/* Dismiss Button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Dismiss Welcome Message"
        >
          <X size={16} />
        </button>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-emerald-300 mb-3">
          <Sparkles size={13} />
          <span>MINIMALIST 3D ARCHITECTURE</span>
        </div>

        {/* Welcome Headline */}
        <h2 className="text-2xl sm:text-3xl font-serif-title font-semibold tracking-wide text-white mb-2">
          Welcome to My World
        </h2>

        {/* Subtitle / Instruction */}
        <p className="text-sm text-neutral-300 font-light max-w-sm mx-auto mb-5 leading-relaxed">
          Explore the rooms to discover my story. Six spaces connected through a continuous zigzag corridor.
        </p>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onExploreRoom01}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-neutral-950 hover:bg-neutral-100 font-semibold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span>Enter Room 01: Photo Album</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-sm font-medium transition-all cursor-pointer"
          >
            <Eye size={15} />
            <span>Observe Corridor</span>
          </button>
        </div>

        {/* Micro Hint */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-neutral-400">
          <Compass size={12} />
          <span>Scroll up/down to walk • Scroll left/right to turn view 360° • Click room to enter</span>
        </div>
      </div>
    </div>
  );
};
