import React, { useState, useEffect } from 'react';
import { CORRECT_PIN, PIN_SESSION_KEY } from '../data';
import { Shield, Sparkles } from 'lucide-react';

interface PinScreenProps {
  onUnlock: () => void;
}

export const PinScreen: React.FC<PinScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  useEffect(() => {
    if (sessionStorage.getItem(PIN_SESSION_KEY) === '1') {
      onUnlock();
    }
  }, [onUnlock]);

  const handleKeyPress = (val: string) => {
    if (pin.length >= 4) return;
    setError('');
    const newPin = pin + val;
    setPin(newPin);

    if (newPin.length === 4) {
      setTimeout(() => {
        if (newPin === CORRECT_PIN) {
          sessionStorage.setItem(PIN_SESSION_KEY, '1');
          onUnlock();
        } else {
          setIsShaking(true);
          setError('Incorrect PIN');
          setTimeout(() => {
            setPin('');
            setIsShaking(false);
            setError('');
          }, 900);
        }
      }, 150);
    }
  };

  const handleBackspace = () => {
    if (pinEntryLocked()) return;
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const pinEntryLocked = () => {
    return isShaking || pin.length === 4;
  };

  return (
    <div className="fixed inset-0 bg-[#1a1a2e] z-[9999] flex flex-col items-center justify-center p-6 select-none">
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="w-16 h-16 rounded-full bg-[#252538] border border-[rgba(201,184,232,0.15)] flex items-center justify-center text-[#c9b8e8] shadow-lg animate-pulse mb-2">
          <Shield size={32} />
        </div>
        <h1 className="font-serif text-3xl tracking-wide text-[#c9b8e8] flex items-center gap-2">
          Zaor Studio <Sparkles size={16} />
        </h1>
        <p className="text-xs text-[#9a96a8] tracking-widest uppercase">Decrypted Local Session</p>
      </div>

      <div className="flex gap-4 mb-6">
        {[0, 1, 2, 3].map(i => {
          const isFilled = i < pin.length;
          const isErr = error !== '';
          return (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                isShaking && isErr
                  ? 'bg-[#c47a8a] border-[#c47a8a] scale-110 animate-bounce'
                  : isFilled
                  ? 'bg-[#c9b8e8] border-[#c9b8e8] scale-105'
                  : 'bg-transparent border-[#9a96a8]'
              }`}
            />
          );
        })}
      </div>

      <div className="h-6 mb-8 text-[#c47a8a] text-sm tracking-wide font-medium">
        {error}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-[260px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(val => (
          <button
            key={val}
            className="w-16 h-16 rounded-full bg-[#252538] border border-white/5 text-2xl font-medium active:bg-[#2e2e48] active:scale-95 transition-all text-[#f0ece4] flex items-center justify-center cursor-pointer shadow-md"
            onClick={() => !pinEntryLocked() && handleKeyPress(val)}
          >
            {val}
          </button>
        ))}
        <div className="w-16 h-16" />
        <button
          className="w-16 h-16 rounded-full bg-[#252538] border border-white/5 text-2xl font-medium active:bg-[#2e2e48] active:scale-95 transition-all text-[#f0ece4] flex items-center justify-center cursor-pointer shadow-md"
          onClick={() => !pinEntryLocked() && handleKeyPress('0')}
        >
          0
        </button>
        <button
          className="w-16 h-16 rounded-full text-base font-semibold text-[#9a96a8] flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
          onClick={handleBackspace}
        >
          ⌫
        </button>
      </div>
    </div>
  );
};
