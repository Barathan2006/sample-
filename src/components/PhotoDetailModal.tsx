import React, { useEffect } from 'react';
import { MemoryPhoto } from '../data/photos';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  Camera, 
  Tag, 
  Share2, 
  Check,
  Edit3
} from 'lucide-react';

interface PhotoDetailModalProps {
  photo: MemoryPhoto | null;
  allPhotos: MemoryPhoto[];
  onClose: () => void;
  onSelectPhoto: (photo: MemoryPhoto) => void;
  onEditPhoto?: (photo: MemoryPhoto) => void;
}

export const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  photo,
  allPhotos,
  onClose,
  onSelectPhoto,
  onEditPhoto,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (!photo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo, allPhotos]);

  if (!photo) return null;

  const currentIndex = allPhotos.findIndex((p) => p.id === photo.id);
  const totalCount = allPhotos.length;

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + totalCount) % totalCount;
    onSelectPhoto(allPhotos[prevIndex]);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % totalCount;
    onSelectPhoto(allPhotos[nextIndex]);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-neutral-950/80 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col md:flex-row bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Actions */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {onEditPhoto && (
            <button
              onClick={() => onEditPhoto(photo)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold text-xs shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Change this photo or edit details"
            >
              <Edit3 size={13} />
              <span>Change Photo</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-neutral-950/70 border border-white/10 text-white hover:bg-neutral-800 transition-all cursor-pointer shadow-lg hover:scale-105"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Left Side: Photo Frame Container */}
        <div className="relative flex-1 bg-neutral-950 flex items-center justify-center min-h-[320px] md:min-h-[500px] p-6 sm:p-8 select-none overflow-hidden group">
          {/* Subtle architectural background grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Physical Photo Mount */}
          <div className="relative max-h-[75vh] max-w-full flex items-center justify-center p-3 sm:p-4 bg-white/95 rounded-xl shadow-2xl transition-transform duration-300">
            <img
              src={photo.imageUrl}
              alt={photo.title}
              className="max-h-[65vh] w-auto object-contain rounded-md shadow-inner"
              onError={(e) => {
                // Fallback gracefully to high quality placeholder if network blocks Unsplash
                const target = e.target as HTMLImageElement;
                target.src = 'https://picsum.photos/800/600';
              }}
            />
          </div>

          {/* Floating Navigation Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-900/80 border border-white/15 text-white hover:bg-white hover:text-neutral-950 transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95"
            title="Previous Memory (Left Arrow)"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-900/80 border border-white/15 text-white hover:bg-white hover:text-neutral-950 transition-all cursor-pointer shadow-xl hover:scale-110 active:scale-95"
            title="Next Memory (Right Arrow)"
          >
            <ChevronRight size={22} />
          </button>

          {/* Counter Badge */}
          <div className="absolute bottom-4 left-6 px-3 py-1 rounded-full bg-neutral-900/80 border border-white/10 text-xs font-mono text-neutral-300">
            {currentIndex + 1} / {totalCount}
          </div>
        </div>

        {/* Right Side: Memory Story Details */}
        <div className="w-full md:w-[380px] lg:w-[420px] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-neutral-900/95 border-t md:border-t-0 md:border-l border-white/10">
          <div>
            {/* Category & Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 border border-white/10">
                <Tag size={12} />
                {photo.category}
              </span>
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">
                {photo.type === 'pedestal' ? 'CENTER ALBUM' : photo.type === 'floating' ? 'FLOATING FRAME' : 'WALL GALLERY'}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold font-serif-title tracking-tight text-white mb-2 leading-snug">
              {photo.title}
            </h2>

            {/* Date & Location Metas */}
            <div className="space-y-1.5 py-3 border-y border-white/10 my-4 text-xs text-neutral-300">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-neutral-400" />
                <span>{photo.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-neutral-400" />
                <span>{photo.location}</span>
              </div>
              {photo.cameraInfo && (
                <div className="flex items-center gap-2 text-neutral-400 font-mono text-[11px] pt-1">
                  <Camera size={14} className="text-neutral-500" />
                  <span>{photo.cameraInfo}</span>
                </div>
              )}
            </div>

            {/* Story / Description */}
            <div className="mt-4">
              <h4 className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2">Memory Chronicle</h4>
              <p className="text-sm text-neutral-200 leading-relaxed font-light">
                "{photo.description}"
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors text-xs font-medium cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
                <span>{copied ? 'Link Copied' : 'Share'}</span>
              </button>

              {onEditPhoto && (
                <button
                  onClick={() => onEditPhoto(photo)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-emerald-300 border border-emerald-400/20 hover:border-emerald-400/40 transition-all text-xs font-semibold cursor-pointer"
                >
                  <Edit3 size={13} />
                  <span>Change / Edit</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-neutral-300 cursor-pointer"
              >
                PREV
              </button>
              <button
                onClick={handleNext}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-neutral-300 cursor-pointer"
              >
                NEXT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
