import React, { useState, useEffect } from 'react';
import { Lock, Unlock, X, Delete, ShieldAlert, CheckCircle2, KeyRound } from 'lucide-react';
import { audioSynthesizer } from '../utils/audioSynthesizer';

interface RoomPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ROOM_01_PASSCODE = '2627';

export const RoomPasscodeModal: React.FC<RoomPasscodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Enter 4-digit security code');

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setStatus('idle');
      setStatusMessage('Enter 4-digit security code');
    }
  }, [isOpen]);

  // Physical keyboard support (0-9, Backspace, Escape, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (status === 'success') return;

      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Delete' || e.key === 'c' || e.key === 'C') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, status]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length >= 4 || status === 'success') return;

    audioSynthesizer.playKeypadBeep(520 + parseInt(digit, 10) * 35);
    const newPin = pin + digit;
    setPin(newPin);
    setStatus('idle');
    setStatusMessage('Enter 4-digit security code');

    // Auto verify once 4 digits entered
    if (newPin.length === 4) {
      verifyPin(newPin);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0 && status !== 'success') {
      audioSynthesizer.playKeypadBeep(420);
      setPin((prev) => prev.slice(0, -1));
      setStatus('idle');
      setStatusMessage('Enter 4-digit security code');
    }
  };

  const handleClear = () => {
    if (status !== 'success') {
      audioSynthesizer.playKeypadBeep(380);
      setPin('');
      setStatus('idle');
      setStatusMessage('Enter 4-digit security code');
    }
  };

  const verifyPin = (candidatePin: string) => {
    if (candidatePin === ROOM_01_PASSCODE) {
      setStatus('success');
      setStatusMessage('ACCESS GRANTED • UNLOCKING GATE');
      audioSynthesizer.playAccessGranted();

      setTimeout(() => {
        onSuccess();
      }, 550);
    } else {
      setStatus('error');
      setStatusMessage('ACCESS DENIED • INCORRECT PASSCODE');
      audioSynthesizer.playAccessDenied();

      // Shake and clear after short delay
      setTimeout(() => {
        setPin('');
        setStatus('idle');
        setStatusMessage('Try again (Code: 2627)');
      }, 850);
    }
  };

  const keypadKeys = [
    { num: '1', letters: '' },
    { num: '2', letters: 'ABC' },
    { num: '3', letters: 'DEF' },
    { num: '4', letters: 'GHI' },
    { num: '5', letters: 'JKL' },
    { num: '6', letters: 'MNO' },
    { num: '7', letters: 'PQRS' },
    { num: '8', letters: 'TUV' },
    { num: '9', letters: 'WXYZ' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-neutral-900 border border-white/10 rounded-3xl p-6 sm:p-7 text-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow background */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            status === 'success'
              ? 'bg-emerald-500/20'
              : status === 'error'
              ? 'bg-rose-500/25'
              : 'bg-emerald-400/10'
          }`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Cancel (Esc)"
        >
          <X size={18} />
        </button>

        {/* Lock Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className={`p-3.5 rounded-2xl border mb-3 transition-all duration-300 ${
              status === 'success'
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400 scale-110 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                : status === 'error'
                ? 'bg-rose-500/20 border-rose-400/50 text-rose-400 animate-bounce'
                : 'bg-white/5 border-white/10 text-emerald-400'
            }`}
          >
            {status === 'success' ? (
              <Unlock size={28} className="animate-in spin-in-12 duration-300" />
            ) : status === 'error' ? (
              <ShieldAlert size={28} />
            ) : (
              <Lock size={28} />
            )}
          </div>

          <h3 className="font-semibold text-lg tracking-wide text-white flex items-center gap-1.5 font-mono">
            <span>ROOM 01</span>
            <span className="text-neutral-500">•</span>
            <span className="text-emerald-400">SECURITY LOCK</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            The Memory Pavilion • Electronic Keypad
          </p>
        </div>

        {/* 4-Digit Passcode Display Slots */}
        <div className="flex flex-col items-center mb-6">
          <div
            className={`flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-neutral-950 border transition-all duration-200 ${
              status === 'error'
                ? 'border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-shake'
                : status === 'success'
                ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                : 'border-white/15'
            }`}
          >
            {[0, 1, 2, 3].map((slotIdx) => {
              const isFilled = pin.length > slotIdx;
              return (
                <div
                  key={slotIdx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 flex items-center justify-center ${
                    status === 'success'
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] scale-110'
                      : status === 'error'
                      ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                      : isFilled
                      ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)] scale-105'
                      : 'border-2 border-white/20 bg-white/5'
                  }`}
                />
              );
            })}
          </div>

          {/* Status Prompt Message */}
          <div
            className={`mt-2.5 text-xs font-mono tracking-tight font-medium transition-colors ${
              status === 'success'
                ? 'text-emerald-400'
                : status === 'error'
                ? 'text-rose-400'
                : 'text-neutral-400'
            }`}
          >
            {statusMessage}
          </div>
        </div>

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto mb-5">
          {keypadKeys.map(({ num, letters }) => (
            <button
              key={num}
              type="button"
              disabled={status === 'success'}
              onClick={() => handleDigit(num)}
              className="flex flex-col items-center justify-center h-14 rounded-2xl bg-neutral-950/70 border border-white/10 hover:border-white/25 hover:bg-neutral-800 text-white font-mono text-xl font-medium shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span>{num}</span>
              {letters && (
                <span className="text-[9px] font-sans tracking-widest text-neutral-500 -mt-0.5">
                  {letters}
                </span>
              )}
            </button>
          ))}

          {/* Bottom Row: Clear, 0, Delete */}
          <button
            type="button"
            disabled={status === 'success'}
            onClick={handleClear}
            className="flex items-center justify-center h-14 rounded-2xl bg-neutral-950/40 border border-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-mono text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            title="Clear"
          >
            CLEAR
          </button>

          <button
            type="button"
            disabled={status === 'success'}
            onClick={() => handleDigit('0')}
            className="flex items-center justify-center h-14 rounded-2xl bg-neutral-950/70 border border-white/10 hover:border-white/25 hover:bg-neutral-800 text-white font-mono text-xl font-medium shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            0
          </button>

          <button
            type="button"
            disabled={status === 'success'}
            onClick={handleDelete}
            className="flex items-center justify-center h-14 rounded-2xl bg-neutral-950/40 border border-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            title="Delete last digit (Backspace)"
          >
            <Delete size={18} />
          </button>
        </div>

        {/* Footer Hint & Cancel */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
            <KeyRound size={12} className="text-emerald-400" />
            <span>Keypad Code: 2627</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
