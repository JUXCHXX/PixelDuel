import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InviteManager, Invite } from '../services/InviteManager';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../engine/SoundManager';
import { AvatarManager } from '../services/AvatarManager';

interface JoinGameWithLinkProps {
  onInviteAccepted: (inviteId: string, roomCode: string, fromUsername: string, fromNumber: number) => void;
  onCancel: () => void;
}

const JoinGameWithLink: React.FC<JoinGameWithLinkProps> = ({ onInviteAccepted, onCancel }) => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const loadInvite = async () => {
      if (!roomCode) {
        setError('Código de sala inválido');
        setLoading(false);
        return;
      }

      try {
        const inv = await InviteManager.getInviteByRoomCode(roomCode);
        if (!inv) {
          setError('La invitación ha expirado o no existe');
        } else if (inv.status !== 'pending') {
          setError('Esta invitación ya no está disponible');
        } else {
          setInvite(inv);
        }
      } catch (err) {
        console.error('Error loading invite:', err);
        setError('Error al cargar la invitación');
      } finally {
        setLoading(false);
      }
    };

    loadInvite();
  }, [roomCode]);

  const handleAccept = async () => {
    if (!invite || !user) return;

    setAccepting(true);
    try {
      soundManager.victoryXX?.() || soundManager.victory();
      await InviteManager.acceptInvite(invite.id);

      onInviteAccepted(
        invite.id,
        invite.roomCode!,
        invite.from.username,
        invite.from.userNumber
      );
    } catch (err) {
      console.error('Error accepting invite:', err);
      setError('Error al aceptar la invitación');
      setAccepting(false);
    }
  };

  const handleReject = () => {
    soundManager.death();
    onCancel();
  };

  if (loading) {
    return (
      <div className="scanlines min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500 to-magenta-500" />
        </div>
        <div className="relative z-10 text-center">
          <p className="font-arcade text-cyan-400 animate-pulse text-lg">CARGANDO INVITACIÓN...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scanlines min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500 to-magenta-500" />
        </div>
        <div className="relative z-10 text-center space-y-6">
          <h1 className="glitch-text font-arcade text-3xl text-red-400" data-text="ERROR">
            ERROR
          </h1>
          <div className="text-4xl">❌</div>
          <p className="font-arcade text-red-300 text-sm">{error}</p>
          <button onClick={handleReject} className="neon-btn mt-6">
            ← VOLVER AL MENÚ
          </button>
        </div>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  return (
    <div className="scanlines min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500 to-magenta-500" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md">
        {/* Title */}
        <h1 className="glitch-text font-arcade text-3xl text-cyan-400 text-center" data-text="¿JUGAR?">
          ¿JUGAR?
        </h1>

        {/* Inviter Info */}
        <div className="bg-gray-900 border-2 border-cyan-400 rounded-lg p-8 w-full text-center space-y-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <canvas
              width={64}
              height={64}
              className="border-2 border-cyan-400"
              style={{ imageRendering: 'pixelated' }}
              ref={(canvas) => {
                if (canvas) AvatarManager.drawAvatar(canvas, invite.from.avatar);
              }}
            />
          </div>

          {/* Player Info */}
          <div>
            <p className="font-arcade text-xs text-cyan-300 mb-2">DESAFÍO DE</p>
            <p className="font-arcade text-xl text-cyan-200">{invite.from.username}</p>
            <p className="font-arcade text-xs text-cyan-500">#{String(invite.from.userNumber).padStart(4, '0')}</p>
          </div>

          {/* Game Text */}
          <p className="font-arcade text-xs text-magenta-400 mt-4">
            ¡Te ha enviado una invitación para jugar!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 w-full">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="flex-1 neon-btn bg-green-900 hover:bg-green-800 disabled:opacity-50"
          >
            ✅ ACEPTAR
          </button>
          <button
            onClick={handleReject}
            disabled={accepting}
            className="flex-1 neon-btn bg-red-900 hover:bg-red-800 disabled:opacity-50"
          >
            ❌ RECHAZAR
          </button>
        </div>

        {/* Back link for safety */}
        {!accepting && (
          <button
            onClick={handleReject}
            className="font-arcade text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            ← Volver al menú
          </button>
        )}
      </div>
    </div>
  );
};

export default JoinGameWithLink;
