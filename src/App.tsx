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
import { EditPhotoModal } from './components/EditPhotoModal';
import { ManageRoomPhotosModal } from './components/ManageRoomPhotosModal';
import { RoomPasscodeModal } from './components/RoomPasscodeModal';
import { ROOMS_DATA } from './data/rooms';
import { MemoryPhoto, getStoredPhotos, saveStoredPhotos } from './data/photos';
import { audioSynthesizer } from './utils/audioSynthesizer';
import { Plus, Images, Edit3, Lock } from 'lucide-react';

export default function App() {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<MemoryPhoto[]>(getStoredPhotos());
  const [selectedPhoto, setSelectedPhoto] = useState<MemoryPhoto | null>(null);
  const [photoToEdit, setPhotoToEdit] = useState<MemoryPhoto | null>(null);
  const [isRoom1Unlocked, setIsRoom1Unlocked] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  const activeRoom = currentRoomId
    ? ROOMS_DATA.find((r) => r.id === currentRoomId)
    : null;

  const handleSelectRoom = (roomId: string) => {
    if (roomId === 'room-01' && !isRoom1Unlocked) {
      setIsPasscodeModalOpen(true);
      return;
    }
    setCurrentRoomId(roomId);
    audioSynthesizer.playDoorClick();
  };

  const handlePasscodeSuccess = () => {
    setIsRoom1Unlocked(true);
    setIsPasscodeModalOpen(false);
    setCurrentRoomId('room-01');
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

  const handleSavePhoto = (updatedPhoto: MemoryPhoto) => {
    const updated = photos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p));
    setPhotos(updated);
    saveStoredPhotos(updated);
    if (selectedPhoto?.id === updatedPhoto.id) {
      setSelectedPhoto(updatedPhoto);
    }
  };

  const handleOpenEditPhoto = (photo: MemoryPhoto) => {
    setPhotoToEdit(photo);
    setIsEditModalOpen(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0f1115] select-none">
      {/* 1. Main 3D House Environment Engine */}
      <HouseEnvironment
        currentRoomId={currentRoomId}
        onSelectRoom={handleSelectRoom}
        onSelectPhoto={handleSelectPhoto}
        photos={photos}
        isRoom1Unlocked={isRoom1Unlocked}
      />

      {/* 2. Welcome Landing Banner (Visible when at corridor entrance) */}
      <WelcomeOverlay
        isVisible={currentRoomId === null}
        onExploreRoom01={() => handleSelectRoom('room-01')}
      />

      {/* 3. Room 01 In-Room Action Strip (Quick Add, Change Photos & Album Trigger) */}
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
              onClick={() => setIsManageModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900/80 border border-emerald-500/30 text-emerald-300 hover:bg-neutral-800 text-xs font-medium shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-105"
            >
              <Edit3 size={14} className="text-emerald-400" />
              <span>Change / Edit Photos</span>
            </button>

            <button
              onClick={() => {
                setIsRoom1Unlocked(false);
                setCurrentRoomId(null);
                audioSynthesizer.playDoorClick();
              }}
              title="Lock Room 01 with passcode 2627 and return to hallway"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900/80 border border-amber-500/30 text-amber-300 hover:bg-neutral-800 text-xs font-medium shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-105"
            >
              <Lock size={13} className="text-amber-400" />
              <span>Lock Room</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 text-xs font-semibold shadow-lg cursor-pointer transition-all hover:scale-105"
            >
              <Plus size={14} />
              <span>Upload Photo from Laptop</span>
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
        onOpenAddMemory={() => setIsAddModalOpen(true)}
        totalMemoriesCount={photos.length}
      />

      {/* 5. Photo Enlargement & Detail Modal with Edit Trigger */}
      <PhotoDetailModal
        photo={selectedPhoto}
        allPhotos={photos}
        onClose={() => setSelectedPhoto(null)}
        onSelectPhoto={setSelectedPhoto}
        onEditPhoto={handleOpenEditPhoto}
      />

      {/* 6. Change / Edit Photo Modal */}
      <EditPhotoModal
        photo={photoToEdit}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSavePhoto={handleSavePhoto}
      />

      {/* 7. Manage Room 01 All Photos Modal */}
      <ManageRoomPhotosModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        photos={photos}
        onSelectPhotoToView={(p) => setSelectedPhoto(p)}
        onSelectPhotoToEdit={handleOpenEditPhoto}
        onOpenAddNew={() => setIsAddModalOpen(true)}
      />

      {/* 8. Add Custom Memory Modal */}
      <AddMemoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPhoto={handleAddPhoto}
      />

      {/* 9. About Architectural Specs Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* 10. Room 01 Security Passcode Lock Modal */}
      <RoomPasscodeModal
        isOpen={isPasscodeModalOpen}
        onClose={() => setIsPasscodeModalOpen(false)}
        onSuccess={handlePasscodeSuccess}
      />
    </div>
  );
}
