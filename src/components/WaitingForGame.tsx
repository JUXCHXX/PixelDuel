import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../engine/SoundManager';

interface WaitingForGameProps {
  opponentUsername: string;
  opponentNumber: number;
  onCancel: () => void;
}

const WaitingForGame: React.FC<WaitingForGameProps> = ({ opponentUsername, opponentNumber, onCancel }) => {
  const [dots, setDots] = useState('...');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="scanlines min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500 to-magenta-500" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 crt-on">
        <h1 className="glitch-text font-arcade text-3xl text-cyan-400" data-text="WAITING FOR HOST">
          WAITING FOR HOST
        </h1>

        {/* Opponent info */}
        <div className="border-2 border-cyan-400 rounded-lg p-6 bg-gray-900/50 text-center">
          <p className="font-arcade text-cyan-300 text-lg">{opponentUsername}</p>
          <p className="font-arcade text-cyan-400 text-sm">#{String(opponentNumber).padStart(4, '0')}</p>
        </div>

        {/* Waiting animation */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl animate-bounce">🎮</div>
          <p className="font-arcade text-cyan-400 text-sm">
            Host is selecting a game{dots}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-2 border border-cyan-400 rounded overflow-hidden">
          <div className="h-full bg-cyan-400 animate-pulse" style={{ width: '100%' }} />
        </div>

        {/* Cancel button */}
        <button
          onClick={() => {
            soundManager.death();
            onCancel();
          }}
          className="neon-btn text-sm mt-8"
        >
          ← CANCEL
        </button>

        {/* Info */}
        <p className="font-arcade text-[10px] text-cyan-300 opacity-60 text-center">
          Stand by while your opponent<br />
          chooses the game
        </p>
      </div>
    </div>
  );
};

export default WaitingForGame;
