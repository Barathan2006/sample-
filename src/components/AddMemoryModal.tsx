import React, { useState } from 'react';
import { MemoryPhoto } from '../data/photos';
import { X, Plus, Image, Sparkles } from 'lucide-react';

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
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState<MemoryPhoto['category']>('Moments');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) return;

    const newPhoto: MemoryPhoto = {
      id: `photo-custom-${Date.now()}`,
      title,
      date: date || 'Present Day',
      location: location || 'Personal Archive',
      description: description || 'A preserved memory in the 3D House.',
      imageUrl,
      category,
      aspectRatio: 1.33,
      type: 'floating',
      worldPosition: [-10.5 + (Math.random() - 0.5) * 2, 2.0 + (Math.random() - 0.5) * 0.6, -13.5 + (Math.random() - 0.5) * 2],
      worldRotation: [(Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.05],
      size: [1.3, 1.0]
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
        className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10 text-emerald-400">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-base">Add New Memory</h3>
              <p className="text-xs text-neutral-400">Add a framed photograph into Room 01</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-mono text-neutral-300 mb-1">Image URL *</label>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... or any image URL"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer in Santorini"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-neutral-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MemoryPhoto['category'])}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              >
                <option value="Travel">Travel</option>
                <option value="Moments">Moments</option>
                <option value="Architecture">Architecture</option>
                <option value="Nature">Nature</option>
                <option value="Art">Art</option>
                <option value="People">People</option>
              </select>
            </div>
          </div>

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
                placeholder="e.g. Kyoto, Japan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-300 mb-1">Description / Story</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What made this moment unforgettable?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 text-xs font-semibold shadow-lg cursor-pointer"
            >
              Place in Room 01
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
