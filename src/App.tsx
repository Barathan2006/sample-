/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HouseEnvironment } from './components/HouseEnvironment';
import { NavigationUI } from './components/NavigationUI';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { PhotoDetailModal } from './components/PhotoDetailModal';
import { AboutModal } from './components/AboutModal';
import { AddMemoryModal } from './components/AddMemoryModal';
import { ROOMS_DATA } from './data/rooms';
import { MemoryPhoto, getStoredPhotos, saveStoredPhotos } from './data/photos';
import { audioSynthesizer } from './utils/audioSynthesizer';
import { Plus, Images } from 'lucide-react';

export default function App() {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<MemoryPhoto[]>(getStoredPhotos());
  const [selectedPhoto, setSelectedPhoto] = useState<MemoryPhoto | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  const activeRoom = currentRoomId
    ? ROOMS_DATA.find((r) => r.id === currentRoomId)
    : null;

  const handleSelectRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
    audioSynthesizer.playDoorClick();
  };

  const handleReturnToCorridor = () => {
    setCurrentRoomId(null);
    audioSynthesizer.playDoorClick();
  };

  const handleSelectPhoto = (photo: MemoryPhoto) => {
    setSelectedPhoto(photo);
    audioSynthesizer.playPhotoClick();
  };

  const handleToggleSound = () => {
    const enabled = audioSynthesizer.toggleSound();
    setIsSoundEnabled(enabled);
  };

  const handleAddPhoto = (newPhoto: MemoryPhoto) => {
    const updated = [newPhoto, ...photos];
    setPhotos(updated);
    saveStoredPhotos(updated);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1115] select-none">
      {/* 1. Main 3D House Environment Engine */}
      <HouseEnvironment
        currentRoomId={currentRoomId}
        onSelectRoom={handleSelectRoom}
        onSelectPhoto={handleSelectPhoto}
        photos={photos}
      />

      {/* 2. Welcome Landing Banner (Visible when at corridor entrance) */}
      <WelcomeOverlay
        isVisible={currentRoomId === null}
        onExploreRoom01={() => handleSelectRoom('room-01')}
      />

      {/* 3. Room 01 In-Room Action Strip (Quick Add Memory & Album Trigger) */}
      {currentRoomId === 'room-01' && (
        <div className="pointer-events-none fixed top-24 right-6 z-20 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => {
                const centerPhoto = photos.find((p) => p.type === 'pedestal') || photos[0];
                if (centerPhoto) setSelectedPhoto(centerPhoto);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900/80 border border-white/10 text-white hover:bg-neutral-800 text-xs font-medium shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-105"
            >
              <Images size={14} className="text-emerald-400" />
              <span>Open Center Album</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 text-xs font-semibold shadow-lg cursor-pointer transition-all hover:scale-105"
            >
              <Plus size={14} />
              <span>Add Memory</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Navigation UI Header HUD */}
      <NavigationUI
        currentRoomId={currentRoomId}
        onSelectRoom={handleSelectRoom}
        onReturnToCorridor={handleReturnToCorridor}
        onToggleSound={handleToggleSound}
        isSoundEnabled={isSoundEnabled}
        onOpenAbout={() => setIsAboutOpen(true)}
        totalMemoriesCount={photos.length}
      />

      {/* 6. Photo Enlargement & Detail Modal */}
      <PhotoDetailModal
        photo={selectedPhoto}
        allPhotos={photos}
        onClose={() => setSelectedPhoto(null)}
        onSelectPhoto={setSelectedPhoto}
      />

      {/* 7. Add Custom Memory Modal */}
      <AddMemoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPhoto={handleAddPhoto}
      />

      {/* 8. About Architectural Specs Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}
