import React, { useState, useRef, useEffect } from 'react';
import { MemoryPhoto } from '../data/photos';
import { 
  X, 
  UploadCloud, 
  FolderOpen, 
  Link as LinkIcon, 
  Check, 
  Laptop, 
  Image as ImageIcon,
  Edit3,
  RotateCcw,
  Tag,
  Calendar,
  MapPin,
  Camera,
  Trash2
} from 'lucide-react';
import { audioSynthesizer } from '../utils/audioSynthesizer';

interface EditPhotoModalProps {
  photo: MemoryPhoto | null;
  isOpen: boolean;
  onClose: () => void;
  onSavePhoto: (updatedPhoto: MemoryPhoto) => void;
  onDeletePhoto?: (photoId: string) => void;
}

export const EditPhotoModal: React.FC<EditPhotoModalProps> = ({
  photo,
  isOpen,
  onClose,
  onSavePhoto,
  onDeletePhoto,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sourceMode, setSourceMode] = useState<'upload' | 'url'>('upload');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [cameraInfo, setCameraInfo] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState<MemoryPhoto['category']>('Moments');
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; dimensions?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync photo props into form state when modal opens or photo changes
  useEffect(() => {
    if (photo && isOpen) {
      setTitle(photo.title);
      setDate(photo.date);
      setLocation(photo.location);
      setDescription(photo.description);
      setCameraInfo(photo.cameraInfo || '');
      setImageUrl(photo.imageUrl);
      setCategory(photo.category);
      setFileDetails(null);
      setErrorMsg(null);
      setSourceMode('upload');
    }
  }, [photo, isOpen]);

  if (!isOpen || !photo) return null;

  // Process uploaded image file from laptop with local canvas optimization
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WebP, etc.).');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);

    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const rawDataUrl = readerEvent.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;

        // Optimize resolution if very large to prevent memory overhead
        const MAX_DIM = 1600;
        let targetW = naturalW;
        let targetH = naturalH;

        if (targetW > MAX_DIM || targetH > MAX_DIM) {
          if (targetW > targetH) {
            targetH = Math.round((targetH * MAX_DIM) / targetW);
            targetW = MAX_DIM;
          } else {
            targetW = Math.round((targetW * MAX_DIM) / targetH);
            targetH = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetW, targetH);
          const optimizedUrl = canvas.toDataURL('image/jpeg', 0.9);
          setImageUrl(optimizedUrl);
        } else {
          setImageUrl(rawDataUrl);
        }

        setFileDetails({
          name: file.name,
          size: formattedSize,
          dimensions: `${naturalW} × ${naturalH} px`,
        });
        setIsProcessing(false);
      };

      img.onerror = () => {
        setErrorMsg('Failed to decode image file. Please try another image.');
        setIsProcessing(false);
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      setErrorMsg('Failed to read file from your device. Please try again.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleResetToOriginal = () => {
    if (photo) {
      setImageUrl(photo.imageUrl);
      setTitle(photo.title);
      setFileDetails(null);
      setErrorMsg(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl) {
      setErrorMsg('Please ensure the photo has an image and a title.');
      return;
    }

    const updated: MemoryPhoto = {
      ...photo,
      title: title.trim(),
      date: date.trim() || 'Undated Memory',
      location: location.trim() || 'Unknown Location',
      description: description.trim() || 'A cherished memory in the gallery.',
      cameraInfo: cameraInfo.trim() || undefined,
      category,
      imageUrl,
    };

    audioSynthesizer.playDoorClick();
    onSavePhoto(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-neutral-950/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Edit3 size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-base sm:text-lg tracking-wide text-white">
                Change & Edit Photo
              </h3>
              <p className="text-xs text-neutral-400">
                Room 01 • {photo.type === 'pedestal' ? 'Centerpiece Album' : 'Wall Gallery Frame'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-rose-400 hover:text-rose-200 ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Section: Image Replacement */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-emerald-400" />
                <span>Replace Photograph</span>
              </label>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-neutral-950 border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setSourceMode('upload')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    sourceMode === 'upload'
                      ? 'bg-white text-neutral-950 font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Laptop size={13} />
                  <span>From Laptop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('url')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    sourceMode === 'url'
                      ? 'bg-white text-neutral-950 font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <LinkIcon size={13} />
                  <span>Image URL</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Image Preview Box */}
              <div className="md:col-span-5 bg-neutral-950 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden group">
                {imageUrl ? (
                  <div className="relative w-full h-[200px] flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain rounded-lg shadow-md"
                      onError={() => setErrorMsg('Could not load image preview. Check URL or choose file.')}
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleResetToOriginal}
                        title="Revert to original photo"
                        className="p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-[11px] backdrop-blur-md cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw size={12} />
                        <span>Revert</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-500 py-6">
                    <ImageIcon size={36} className="mb-2 opacity-50" />
                    <span className="text-xs">No image selected</span>
                  </div>
                )}

                {fileDetails && (
                  <div className="w-full mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span className="truncate max-w-[140px]">{fileDetails.name}</span>
                    <span>{fileDetails.size}</span>
                  </div>
                )}
              </div>

              {/* Upload Dropzone / URL Input */}
              <div className="md:col-span-7 flex flex-col justify-center h-full">
                {sourceMode === 'upload' ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                      isDragging
                        ? 'border-emerald-400 bg-emerald-500/10'
                        : 'border-white/15 hover:border-white/30 bg-neutral-950/40 hover:bg-neutral-950/80'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    <div className="p-3.5 rounded-full bg-white/5 border border-white/10 mb-3 text-emerald-400">
                      <UploadCloud size={24} />
                    </div>

                    <p className="text-sm font-medium text-white mb-1">
                      Click to choose a new photo from laptop
                    </p>
                    <p className="text-xs text-neutral-400 mb-3">
                      or drag & drop image here (JPEG, PNG, WebP)
                    </p>

                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/10 transition-colors pointer-events-none"
                    >
                      <FolderOpen size={14} />
                      <span>Browse Files</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 p-5 rounded-2xl bg-neutral-950/40 border border-white/10">
                    <div>
                      <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                        Direct Image URL
                      </label>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                      />
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-normal">
                      Paste any direct image link from Unsplash, Imgur, or cloud storage to replace this picture.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Story Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
            {/* Title */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                Photo Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sunset Over the Fjord"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1">
                <Tag size={12} />
                <span>Gallery Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MemoryPhoto['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 transition-colors cursor-pointer"
              >
                <option value="Travel">Travel</option>
                <option value="Moments">Moments</option>
                <option value="Architecture">Architecture</option>
                <option value="Nature">Nature</option>
                <option value="People">People</option>
                <option value="Art">Art</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1">
                <Calendar size={12} />
                <span>Date Captured</span>
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. October 14, 2024"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1">
                <MapPin size={12} />
                <span>Location</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bellagio, Lake Como"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            {/* Camera Info */}
            <div className="md:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1">
                <Camera size={12} />
                <span>Camera / Lens Details (Optional)</span>
              </label>
              <input
                type="text"
                value={cameraInfo}
                onChange={(e) => setCameraInfo(e.target.value)}
                placeholder="e.g. Leica Q3 • 28mm • f/4 • ISO 125"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            {/* Description Chronicle */}
            <div className="md:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                Memory Chronicle / Story
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write the narrative behind this moment..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-400 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Footer Save & Cancel Buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {onDeletePhoto && photo && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition-colors cursor-pointer"
                  title="Delete this photo album from room"
                >
                  <Trash2 size={14} />
                  <span>Delete Photo</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold text-xs sm:text-sm shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Check size={16} />
              <span>Save & Update Photo</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal for Specifically Deleting Photo Album */}
      {showDeleteConfirm && photo && (
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
              This photo album will be permanently deleted from Room 01, and its physical frame will be removed from the 3D gallery walls.
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
                  onClose();
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
    </div>
  );
};
