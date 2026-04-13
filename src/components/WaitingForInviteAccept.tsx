import React, { useEffect, useState } from 'react';
import { InviteManager } from '../services/InviteManager';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../engine/SoundManager';

interface WaitingForInviteAcceptProps {
  inviteId: string;
  targetUsername: string;
  targetNumber: number;
  roomCode: string;
  onAccepted: () => void;
  onBack: () => void;
}

const WaitingForInviteAccept: React.FC<WaitingForInviteAcceptProps> = ({
  inviteId,
  targetUsername,
  targetNumber,
  roomCode,
  onAccepted,
  onBack
}) => {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    // Escucha cambios en la invitación específica
    const unsubscribe = InviteManager.listenToInviteById(inviteId, (invite) => {
      if (invite && invite.status === 'accepted') {
        console.log('Invitación aceptada!');
        soundManager.victory();
        onAccepted();
        return;
      }
    });

    return unsubscribe;
  }, [inviteId, onAccepted]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onBack]);

  return (
    <div className="scanlines min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500 to-magenta-500" />
      </div>

      <div className="relative z-10 text-center space-y-8">
        {/* Title */}
        <div>
          <h1 className="glitch-text font-arcade text-4xl text-cyan-400 mb-4" data-text="ESPERANDO...">
            ESPERANDO...
          </h1>
          <p className="font-arcade text-sm text-cyan-300">
            Invitación enviada a <span className="text-magenta-400">{targetUsername}</span> #{String(targetNumber).padStart(4, '0')}
          </p>
        </div>

        {/* Room Code */}
        <div className="bg-gray-900 border-2 border-cyan-400 rounded p-6 space-y-3">
          <p className="font-arcade text-xs text-gray-400">CÓDIGO DE SALA</p>
          <p className="font-arcade text-4xl text-cyan-300 tracking-widest">{roomCode}</p>
          <p className="font-arcade text-xs text-gray-500">Comparte este código para que se unan otros</p>
        </div>

        {/* Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-magenta-500 rounded-full animate-pulse" />
            <p className="font-arcade text-cyan-300">Esperando aceptación...</p>
          </div>
          <p className="font-arcade text-xs text-gray-500">Expira en {timeLeft}s</p>
        </div>

        {/* Cancel Button */}
        <button
          onClick={() => {
            soundManager.menuSelect();
            onBack();
          }}
          className="neon-btn mt-8"
        >
          CANCELAR
        </button>
      </div>
    </div>
  );
};

export default WaitingForInviteAccept;

