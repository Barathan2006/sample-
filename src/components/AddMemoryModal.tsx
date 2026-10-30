import React, { useState, useRef } from 'react';
import { MemoryPhoto } from '../data/photos';
import { X, Plus, UploadCloud, FolderOpen, Link as LinkIcon, Check, Trash2, Laptop, Image as ImageIcon } from 'lucide-react';

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPhoto: (photo: MemoryPhoto) => void;
}

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({
  isOpen,
  onClose,
  onAddPhoto
}) => {
  const [sourceMode, setSourceMode] = useState<'upload' | 'url'>('upload');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState<MemoryPhoto['category']>('Moments');
  const [aspectRatio, setAspectRatio] = useState<number>(1.33);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; dimensions?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process uploaded file (FileReader + Canvas optimization)
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

    // Suggest title if empty
    if (!title) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setTitle(cleanName);
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const rawDataUrl = readerEvent.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;
        const ratio = naturalW / naturalH;
        setAspectRatio(ratio);

        // Optimize resolution if image is very large (max dimension 1600px)
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
          const optimizedUrl = canvas.toDataURL('image/jpeg', 0.88);
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
        setErrorMsg('Failed to decode this image. Please try another file.');
        setIsProcessing(false);
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      setErrorMsg('Failed to read file from laptop. Please try again.');
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

  const handleClearImage = () => {
    setImageUrl('');
    setFileDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl) {
      setErrorMsg('Please choose an image and provide a title.');
      return;
    }

    // Dynamic 3D frame sizing matching image aspect ratio
    const ratio = aspectRatio > 0 ? aspectRatio : 1.33;
    let frameWidth = 1.35;
    let frameHeight = 1.0;

    if (ratio >= 1) {
      // Landscape or square
      frameWidth = 1.35;
      frameHeight = Number((1.35 / ratio).toFixed(2));
    } else {
      // Portrait
      frameHeight = 1.35;
      frameWidth = Number((1.35 * ratio).toFixed(2));
    }

    // Place within Room 01 floating cluster
    const newPhoto: MemoryPhoto = {
      id: `photo-custom-${Date.now()}`,
      title: title.trim(),
      date: date.trim() || 'Present Day',
      location: location.trim() || 'Personal Archive',
      description: description.trim() || 'A preserved personal memory in the 3D House.',
      imageUrl,
      category,
      aspectRatio: ratio,
      type: 'floating',
      worldPosition: [
        -10.5 + (Math.random() - 0.5) * 2.2,
        2.0 + (Math.random() - 0.5) * 0.7,
        -13.5 + (Math.random() - 0.5) * 2.2
      ],
      worldRotation: [
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.05
      ],
      size: [frameWidth, frameHeight]
    };

    onAddPhoto(newPhoto);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl p-6 text-white shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-white/10 text-emerald-400">
              <Laptop size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-base">Add Photo from Laptop</h3>
              <p className="text-xs text-neutral-400">Select any image from your computer to frame in Room 01</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Source Mode Tabs */}
        <div className="mt-4 flex p-1 bg-neutral-950/80 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setSourceMode('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              sourceMode === 'upload'
                ? 'bg-white text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Laptop size={14} />
            Upload from Laptop
          </button>
          <button
            type="button"
            onClick={() => setSourceMode('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              sourceMode === 'url'
                ? 'bg-white text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LinkIcon size={14} />
            Paste Web URL
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* UPLOAD MODE */}
          {sourceMode === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {!imageUrl ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                      : 'border-white/15 bg-neutral-950/60 hover:border-white/30 hover:bg-neutral-950'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 group-hover:scale-110 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                    <UploadCloud size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-white text-center">
                    Click to browse photos on your laptop
                  </p>
                  <p className="mt-1 text-xs text-neutral-400 text-center">
                    or drag and drop your image directly here
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-medium text-neutral-200 group-hover:bg-white group-hover:text-neutral-950 transition-colors">
                    <FolderOpen size={13} />
                    <span>Choose from Device</span>
                  </div>
                  <span className="mt-2 text-[10px] text-neutral-500">
                    Supports JPG, PNG, WebP, GIF, HEIC • Auto-scaled for 3D
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-neutral-950 rounded-2xl border border-white/10 flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-neutral-800 shrink-0 border border-white/10">
                    <img
                      src={imageUrl}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <Check size={13} />
                      <span>Photo Loaded from Laptop</span>
                    </div>
                    <p className="text-xs text-white truncate font-medium mt-0.5">
                      {fileDetails?.name || 'Local Photo'}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {fileDetails?.size} {fileDetails?.dimensions ? `• ${fileDetails.dimensions}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* URL MODE */}
          {sourceMode === 'url' && (
            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">Image URL *</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setFileDetails(null);
                }}
                placeholder="https://images.unsplash.com/... or any image URL"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
              />
              {imageUrl && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-neutral-950 rounded-xl border border-white/10">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                    onError={() => setErrorMsg('Could not load image from this URL. Please verify the link.')}
                  />
                  <div className="text-xs text-neutral-400 truncate">
                    Online image preview
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
              {errorMsg}
            </p>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Memories"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MemoryPhoto['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 cursor-pointer"
              >
                <option value="Moments">Moments</option>
                <option value="Travel">Travel</option>
                <option value="Architecture">Architecture</option>
                <option value="Nature">Nature</option>
                <option value="Art">Art</option>
                <option value="People">People</option>
              </select>
            </div>
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">Date</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. July 2024"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Paris, France"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-neutral-300 mb-1">Story / Note</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What made this moment special?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!imageUrl || !title.trim() || isProcessing}
              className="px-5 py-2.5 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-white text-xs font-semibold shadow-lg cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>{isProcessing ? 'Processing Image...' : 'Place in Room 01'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
