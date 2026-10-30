import React from 'react';
import { X, Layers, Compass, Sparkles, Box, Camera, Heart } from 'lucide-react';
import { ROOMS_DATA } from '../data/rooms';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-950/80 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-3xl p-6 sm:p-8 text-white shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-emerald-400">
              <Box size={20} />
            </div>
            <div>
              <h2 className="text-lg font-serif-title font-semibold tracking-wide">
                About the 3D Memory House
              </h2>
              <p className="text-xs text-neutral-400">Minimalist White Architectural Pavilion</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-xs sm:text-sm text-neutral-300 leading-relaxed font-light">
          <p>
            The <strong className="text-white font-medium">3D Memory House</strong> is an architectural experiment that translates personal memory curation into a walk-through physical space. Built with pure white surfaces, soft natural lighting, and subtle grey cast shadows, it replaces flat website feeds with a serene, physical promenade.
          </p>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold mb-2 flex items-center gap-1.5">
              <Compass size={14} />
              The Zigzag Corridor Principle
            </h4>
            <p className="text-xs text-neutral-300">
              Six rooms alternate rhythmically along a central pathway: three on the left and three on the right. This layout creates continuous architectural sightlines, revealing new doorways and perspectives as you move through the space.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold mb-3">
              Room Directory
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {ROOMS_DATA.map((room) => (
                <div 
                  key={room.id}
                  className="p-3 rounded-xl bg-neutral-950/60 border border-white/5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-white">{room.displayNumber}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      room.status === 'active' 
                        ? 'bg-emerald-400/20 text-emerald-300' 
                        : 'bg-amber-400/20 text-amber-300'
                    }`}>
                      {room.status === 'active' ? 'ACTIVE' : 'COMING SOON'}
                    </span>
                  </div>
                  <div className="font-medium text-white">{room.title}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{room.subtitle}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1 font-mono">
              <Sparkles size={13} className="text-cyan-400" />
              Engineered with Three.js & React
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white text-neutral-950 font-medium hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Continue Exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
