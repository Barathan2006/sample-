import React, { useState } from 'react';
import { MemoryPhoto } from '../data/photos';
import { X, Edit3, Eye, Plus, Trash2, RotateCcw, Image as ImageIcon, AlertTriangle } from 'lucide-react';

interface ManageRoomPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: MemoryPhoto[];
  onSelectPhotoToView: (photo: MemoryPhoto) => void;
  onSelectPhotoToEdit: (photo: MemoryPhoto) => void;
  onOpenAddNew: () => void;
  onDeletePhoto: (photoId: string) => void;
  onRestoreDefaults?: () => void;
}

export const ManageRoomPhotosModal: React.FC<ManageRoomPhotosModalProps> = ({
  isOpen,
  onClose,
  photos,
  onSelectPhotoToView,
  onSelectPhotoToEdit,
  onOpenAddNew,
  onDeletePhoto,
  onRestoreDefaults,
}) => {
  const [photoToDelete, setPhotoToDelete] = useState<MemoryPhoto | null>(null);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-neutral-950/85 backdrop-blur-xl animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-neutral-950/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ImageIcon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg tracking-wide text-white">
                    Room 01 Gallery Photos
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {photos.length} Displays
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Manage gallery displays: edit chronicles, upload new images, or delete specific photo albums
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onRestoreDefaults && photos.length < 11 && (
                <button
                  onClick={onRestoreDefaults}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
                  title="Restore default exhibition photos"
                >
                  <RotateCcw size={13} />
                  <span className="hidden sm:inline">Reset Defaults</span>
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  onOpenAddNew();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 font-semibold text-xs transition-all hover:scale-105 cursor-pointer shadow-lg"
              >
                <Plus size={14} />
                <span>Add Photo</span>
              </button>

              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Photos Grid or Empty State */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            {photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto">
                <div className="p-4 rounded-3xl bg-neutral-950 border border-white/10 text-neutral-500 mb-4">
                  <ImageIcon size={36} />
                </div>
                <h4 className="font-semibold text-base text-white mb-2">No Photo Albums Found</h4>
                <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                  All photos have been deleted from Room 01. You can add your own custom photos from your laptop or reset to the original architectural collection.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAddNew();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-neutral-950 font-semibold text-xs cursor-pointer shadow-lg"
                  >
                    <Plus size={14} />
                    <span>Upload New Photo</span>
                  </button>
                  {onRestoreDefaults && (
                    <button
                      onClick={onRestoreDefaults}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 cursor-pointer"
                    >
                      <RotateCcw size={14} />
                      <span>Restore Default Collection</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {photos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="group relative flex flex-col bg-neutral-950/70 border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-0.5"
                  >
                    {/* Image Thumbnail Container */}
                    <div className="relative aspect-[4/3] bg-neutral-950 overflow-hidden flex items-center justify-center p-2.5">
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://picsum.photos/600/450';
                        }}
                      />

                      {/* Badge */}
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-neutral-950/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-emerald-300">
                        {photo.type === 'pedestal' ? 'CENTER ALBUM' : `WALL FRAME #${idx + 1}`}
                      </div>

                      {/* Quick Hover Overlay */}
                      <div className="absolute inset-0 bg-neutral-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                        <button
                          onClick={() => {
                            onClose();
                            onSelectPhotoToEdit(photo);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-neutral-950 text-xs font-semibold shadow-lg transition-transform hover:scale-105 cursor-pointer"
                        >
                          <Edit3 size={14} />
                          <span>Change Photo</span>
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            onSelectPhotoToView(photo);
                          }}
                          className="p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-white text-xs border border-white/15 cursor-pointer"
                          title="Inspect Photo"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setPhotoToDelete(photo)}
                          className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs cursor-pointer transition-colors"
                          title="Delete this photo album"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Info & Action Bar */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1">
                          <span>{photo.category}</span>
                          <span>{photo.date}</span>
                        </div>
                        <h4 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">
                          {photo.title}
                        </h4>
                        <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                          {photo.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] text-neutral-400 truncate max-w-[130px]">
                          {photo.location}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              onClose();
                              onSelectPhotoToEdit(photo);
                            }}
                            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setPhotoToDelete(photo)}
                            className="p-1 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete this photo album"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Specifically Deleting Photo Album */}
      {photoToDelete && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPhotoToDelete(null)}
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
                  {photoToDelete.type === 'pedestal' ? 'CENTERPIECE ALBUM' : 'WALL GALLERY FRAME'}
                </p>
              </div>
            </div>

            <p className="text-sm text-neutral-300 mb-2 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">"{photoToDelete.title}"</span>?
            </p>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              This photo album will be permanently removed from Room 01, and its physical frame will be cleared from the 3D gallery walls.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPhotoToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = photoToDelete.id;
                  setPhotoToDelete(null);
                  onDeletePhoto(id);
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
