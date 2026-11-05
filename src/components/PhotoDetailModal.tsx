import React, { useEffect, useState } from 'react';
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
  Edit3,
  Trash2
} from 'lucide-react';

interface PhotoDetailModalProps {
  photo: MemoryPhoto | null;
  allPhotos: MemoryPhoto[];
  onClose: () => void;
  onSelectPhoto: (photo: MemoryPhoto) => void;
  onEditPhoto?: (photo: MemoryPhoto) => void;
  onDeletePhoto?: (photoId: string) => void;
}

export const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  photo,
  allPhotos,
  onClose,
  onSelectPhoto,
  onEditPhoto,
  onDeletePhoto,
}) => {
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!photo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showDeleteConfirm) {
        if (e.key === 'Escape') {
          setShowDeleteConfirm(false);
        }
        return;
      }
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
  }, [photo, allPhotos, showDeleteConfirm]);

  if (!photo) return null;

  const currentIndex = allPhotos.findIndex((p) => p.id === photo.id);
  const totalCount = allPhotos.length;

  const handlePrev = () => {
    if (totalCount === 0) return;
    const prevIndex = (currentIndex - 1 + totalCount) % totalCount;
    onSelectPhoto(allPhotos[prevIndex]);
  };

  const handleNext = () => {
    if (totalCount === 0) return;
    const nextIndex = (currentIndex + 1) % totalCount;
    onSelectPhoto(allPhotos[nextIndex]);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-neutral-950/85 backdrop-blur-xl animate-in fade-in duration-200"
        onClick={onClose}
      >
        {/* Modal Container */}
        <div 
          className="relative w-full max-w-5xl max-h-[92vh] flex flex-col md:flex-row bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Side: Photo Frame Container */}
          <div className="relative flex-1 bg-neutral-950 flex items-center justify-center min-h-[320px] md:min-h-[520px] p-6 sm:p-8 select-none overflow-hidden group">
            {/* Subtle architectural background grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            {/* Mobile close button for quick exit on small screens */}
            <button
              onClick={onClose}
              className="md:hidden absolute top-3 right-3 z-20 p-2 rounded-full bg-neutral-900/80 border border-white/15 text-neutral-300 hover:text-white cursor-pointer shadow-lg"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>

            {/* Physical Photo Mount */}
            <div className="relative max-h-[75vh] max-w-full flex items-center justify-center p-3 sm:p-4 bg-white/95 rounded-xl shadow-2xl transition-transform duration-300">
              <img
                src={photo.imageUrl}
                alt={photo.title}
                className="max-h-[65vh] w-auto object-contain rounded-md shadow-inner"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://picsum.photos/800/600';
                }}
              />
            </div>

            {/* Floating Navigation Arrows */}
            {totalCount > 1 && (
              <>
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
              </>
            )}

            {/* Counter Badge */}
            <div className="absolute bottom-4 left-6 px-3 py-1 rounded-full bg-neutral-900/80 border border-white/10 text-xs font-mono text-neutral-300">
              {currentIndex >= 0 ? currentIndex + 1 : 1} / {totalCount}
            </div>
          </div>

          {/* Right Side: Memory Story Details */}
          <div className="w-full md:w-[400px] lg:w-[440px] p-6 sm:p-7 flex flex-col justify-between overflow-y-auto bg-neutral-900/95 border-t md:border-t-0 md:border-l border-white/10">
            <div>
              {/* Top Row: Category, Tag, Change Photo & Close Button (No overlapping elements) */}
              <div className="flex items-center justify-between gap-3 pb-3.5 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 border border-white/10">
                    <Tag size={12} />
                    {photo.category}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest truncate">
                    {photo.type === 'pedestal' ? 'CENTER ALBUM' : photo.type === 'floating' ? 'FLOATING FRAME' : 'WALL GALLERY'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onEditPhoto && (
                    <button
                      onClick={() => onEditPhoto(photo)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                      title="Change this photo or edit details"
                    >
                      <Edit3 size={13} />
                      <span>Change Photo</span>
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    className="hidden md:flex p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
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

                {onDeletePhoto && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/20 text-xs font-semibold cursor-pointer transition-colors"
                    title="Delete photo album specifically"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              {totalCount > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrev}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-neutral-300 hover:text-white cursor-pointer transition-colors"
                  >
                    PREV
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-neutral-300 hover:text-white cursor-pointer transition-colors"
                  >
                    NEXT
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Specifically Deleting Photo Album */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-md bg-neutral-900 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-white animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/25 text-rose-400">
                <Trash2 size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-lg text-white">Delete Photo Album?</h4>
                <p className="text-xs text-neutral-400 font-mono">
                  {photo.type === 'pedestal' ? 'CENTERPIECE ALBUM' : 'WALL GALLERY FRAME'}
                </p>
              </div>
            </div>

            <p className="text-sm text-neutral-300 mb-2 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">"{photo.title}"</span>?
            </p>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              This photo album will be permanently deleted from Room 01, and its frame will be cleared from the 3D gallery walls.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDeletePhoto?.(photo.id);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <Trash2 size={14} />
                <span>Yes, Delete Album</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
