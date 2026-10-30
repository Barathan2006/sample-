import React, { useState } from 'react';
import { ROOMS_DATA, RoomData } from '../data/rooms';
import { 
  Compass, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Info, 
  Eye, 
  HelpCircle,
  Home,
  Sparkles,
  Layers,
  Plus
} from 'lucide-react';

interface NavigationUIProps {
  currentRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onReturnToCorridor: () => void;
  onToggleSound?: () => void;
  isSoundEnabled?: boolean;
  onOpenAbout?: () => void;
  onOpenAddMemory?: () => void;
  totalMemoriesCount?: number;
}

export const NavigationUI: React.FC<NavigationUIProps> = ({
  currentRoomId,
  onSelectRoom,
  onReturnToCorridor,
  onToggleSound,
  isSoundEnabled = false,
  onOpenAbout,
  onOpenAddMemory,
  totalMemoriesCount = 10
}) => {
  const [showGuide, setShowGuide] = useState(false);

  const activeRoom = currentRoomId 
    ? ROOMS_DATA.find((r) => r.id === currentRoomId) 
    : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 md:p-6">
      {/* Top Header Bar */}
      <header className="pointer-events-auto flex items-start justify-between w-full max-w-7xl mx-auto">
        {/* Brand / House Title */}
        <div className="flex flex-col bg-neutral-950/75 border border-white/10 rounded-2xl p-3.5 md:p-4 text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <h1 className="text-sm md:text-base font-semibold tracking-wide font-mono-num">
              WHITE MEMORY HOUSE
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/10">
              3D ARCHITECTURE
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
            {activeRoom ? (
              <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Inside {activeRoom.displayNumber} — {activeRoom.title}
              </span>
            ) : (
              <span>Corridor Entrance • 6 Interactive Rooms in Zigzag Layout</span>
            )}
          </div>
        </div>

        {/* Top Right Action Tools */}
        <div className="flex items-center gap-2">
          {activeRoom && (
            <button
              onClick={onReturnToCorridor}
              className="pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 font-medium text-xs md:text-sm shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Home size={16} />
              <span>Back to Main Hall</span>
            </button>
          )}

          <button
            onClick={() => setShowGuide(!showGuide)}
            title="Navigation Guide"
            className="pointer-events-auto p-2.5 rounded-xl bg-neutral-950/75 border border-white/10 text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer shadow-lg"
          >
            <HelpCircle size={18} />
          </button>

          {onToggleSound && (
            <button
              onClick={onToggleSound}
              title={isSoundEnabled ? 'Mute Ambient Audio' : 'Play Gentle Ambient Audio'}
              className="pointer-events-auto p-2.5 rounded-xl bg-neutral-950/75 border border-white/10 text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer shadow-lg"
            >
              {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          )}

          {onOpenAddMemory && (
            <button
              onClick={onOpenAddMemory}
              title="Add photo from laptop to Room 01"
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold text-xs shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Photo</span>
            </button>
          )}

          {onOpenAbout && (
            <button
              onClick={onOpenAbout}
              title="About this 3D Architecture"
              className="pointer-events-auto p-2.5 rounded-xl bg-neutral-950/75 border border-white/10 text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer shadow-lg"
            >
              <Info size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Helpful Interactive Instructions Banner (if guide toggled) */}
      {showGuide && (
        <div className="pointer-events-auto self-center max-w-md w-full bg-neutral-950/90 border border-white/15 rounded-2xl p-5 text-white shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 my-auto">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Compass size={18} className="text-cyan-400" />
              How to Explore the 3D House
            </h3>
            <button 
              onClick={() => setShowGuide(false)}
              className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5 cursor-pointer"
            >
              Close
            </button>
          </div>
          <ul className="mt-3.5 space-y-2.5 text-xs text-neutral-300">
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-cyan-400 font-bold">01.</span>
              <span><strong>Scroll Left / Right</strong> on your touchpad to swivel the 360° view like a geosphere; scroll <strong>Up / Down</strong> to walk along the corridor.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-cyan-400 font-bold">02.</span>
              <span><strong>Click any Doorway or Sign</strong> in 3D to step inside that room.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-cyan-400 font-bold">03.</span>
              <span><strong>Inside Room 01</strong>, click any floating photo or wall frame to enlarge, read stories, and navigate through memories.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-cyan-400 font-bold">04.</span>
              <span><strong>Click Back to Main Hall</strong> at any moment to return to the corridor.</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
