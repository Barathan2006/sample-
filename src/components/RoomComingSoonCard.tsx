import React from 'react';
import { RoomData } from '../data/rooms';
import { Clock, Home, ArrowRight, ArrowLeft, Sparkles, Compass } from 'lucide-react';

interface RoomComingSoonCardProps {
  room: RoomData;
  onReturnToCorridor: () => void;
  onSelectNextRoom: () => void;
  onSelectPrevRoom: () => void;
}

export const RoomComingSoonCard: React.FC<RoomComingSoonCardProps> = ({
  room,
  onReturnToCorridor,
  onSelectNextRoom,
  onSelectPrevRoom
}) => {
  return (
    <div className="pointer-events-none fixed bottom-28 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-lg animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="pointer-events-auto bg-neutral-950/85 border border-white/15 rounded-3xl p-5 sm:p-6 text-white shadow-2xl backdrop-blur-xl">
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 font-semibold flex items-center gap-1.5">
              <Clock size={12} />
              COMING SOON
            </span>
            <span className="text-xs font-mono text-neutral-400">
              {room.side.toUpperCase()} WING
            </span>
          </div>

          <span className="text-sm font-bold font-mono-num text-neutral-400">
            {room.displayNumber}
          </span>
        </div>

        {/* Room Title */}
        <h3 className="text-xl sm:text-2xl font-serif-title font-semibold text-white mb-1">
          {room.title}
        </h3>
        <p className="text-xs text-neutral-400 font-mono mb-3">
          {room.subtitle}
        </p>

        {/* Description & Concept */}
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-4">
          {room.description}
        </p>

        {room.futureConcept && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 text-xs text-neutral-300">
            <span className="font-mono text-amber-300 block mb-1 font-medium flex items-center gap-1.5">
              <Sparkles size={13} />
              Planned Installation:
            </span>
            <span>{room.futureConcept}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
          <button
            onClick={onReturnToCorridor}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 font-medium text-xs transition-all cursor-pointer shadow-md"
          >
            <Home size={14} />
            <span>Main Hall</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onSelectPrevRoom}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-neutral-300 cursor-pointer border border-white/10"
              title="Previous Room"
            >
              <ArrowLeft size={14} />
              <span>PREV</span>
            </button>
            <button
              onClick={onSelectNextRoom}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-neutral-300 cursor-pointer border border-white/10"
              title="Next Room"
            >
              <span>NEXT</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
