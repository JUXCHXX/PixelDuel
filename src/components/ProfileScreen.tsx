import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthManager } from '../services/AuthManager';
import { AvatarManager } from '../services/AvatarManager';
import { soundManager } from '../engine/SoundManager';

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, onLogout }) => {
  const { user, profile } = useAuth();
  const [avatarIndex, setAvatarIndex] = useState(profile?.avatar || 0);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  if (!user || !profile) {
    return null;
  }

  const winRatio = profile.gamesPlayed > 0 ? ((profile.wins / profile.gamesPlayed) * 100).toFixed(0) : '0';

  const handleAvatarChange = async (newIndex: number) => {
    const finalIndex = (newIndex + 8) % 8;
    setAvatarIndex(finalIndex);
    setUpdating(true);
    setError('');

    try {
      await AuthManager.updateProfile(user.uid, { avatar: finalIndex });
      soundManager.menuSelect();
    } catch (err: any) {
      soundManager.death();
      setError(err.message || 'Error updating avatar');
      setAvatarIndex(profile.avatar);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthManager.logout();
      soundManager.menuSelect();
      onLogout();
    } catch (err: any) {
      soundManager.death();
      setError(err.message || 'Error logging out');
    }
  };

  return (
    <div className="scanlines min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-b from-magenta-500 to-cyan-500" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 crt-on">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="glitch-text font-arcade text-3xl text-magenta-400 mb-2" data-text="TU PERFIL">
            TU PERFIL
          </h1>
          <p className="font-arcade text-[10px] text-magenta-300">#{String(profile.userNumber).padStart(4, '0')}</p>
        </div>

        {/* Avatar Section */}
        <div className="border-2 border-magenta-400 rounded-lg p-6 bg-gray-900/80 mb-6">
          <p className="font-arcade text-xs text-magenta-400 text-center mb-3">AVATAR</p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleAvatarChange(avatarIndex - 1)}
              disabled={updating}
              className="text-3xl hover:scale-110 transition-transform disabled:opacity-50"
            >
              ◀
            </button>

            <div>
              <canvas
                className="w-20 h-20 border-2 border-magenta-400 rounded-lg bg-black mx-auto mb-2"
                style={{ imageRendering: 'pixelated' }}
                ref={(canvas) => {
                  if (canvas) AvatarManager.drawAvatar(canvas, avatarIndex);
                }}
              />
              <p className="text-center font-arcade text-[10px] text-magenta-300">
                {AvatarManager.getAvatarEmoji(avatarIndex)} {AvatarManager.getAvatarName(avatarIndex)}
              </p>
            </div>

            <button
              onClick={() => handleAvatarChange(avatarIndex + 1)}
              disabled={updating}
              className="text-3xl hover:scale-110 transition-transform disabled:opacity-50"
            >
              ▶
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="space-y-3 mb-6">
          {/* Username */}
          <div className="border-2 border-cyan-400 rounded-lg p-4 bg-gray-900/50">
            <p className="font-arcade text-[10px] text-cyan-400 mb-1">NOMBRE DE JUGADOR</p>
            <p className="font-arcade text-lg text-cyan-100">{profile.username}</p>
          </div>

          {/* Email */}
          <div className="border-2 border-cyan-400 rounded-lg p-4 bg-gray-900/50">
            <p className="font-arcade text-[10px] text-cyan-400 mb-1">EMAIL</p>
            <p className="font-arcade text-sm text-cyan-200 break-all">{profile.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="border-2 border-yellow-500 rounded-lg p-4 bg-gray-900/50 mb-6">
          <p className="font-arcade text-xs text-yellow-500 text-center mb-3">ESTADÍSTICAS</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="font-arcade text-2xl text-yellow-400">{profile.gamesPlayed}</p>
              <p className="font-arcade text-[10px] text-yellow-300">Partidas</p>
            </div>

            <div className="text-center">
              <p className="font-arcade text-2xl text-lime-400">{profile.wins}</p>
              <p className="font-arcade text-[10px] text-lime-300">Victorias</p>
            </div>

            <div className="text-center">
              <p className="font-arcade text-2xl text-red-400">{profile.losses}</p>
              <p className="font-arcade text-[10px] text-red-300">Derrotas</p>
            </div>

            <div className="text-center">
              <p className="font-arcade text-2xl text-cyan-400">{winRatio}%</p>
              <p className="font-arcade text-[10px] text-cyan-300">Ratio</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500 rounded text-red-400 text-xs font-body mb-6">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              soundManager.menuSelect();
              onBack();
            }}
            className="neon-btn text-sm"
          >
            ← VOLVER
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-900 hover:bg-red-800 text-red-100 border-2 border-red-600 rounded-lg px-4 py-2
                     font-arcade text-sm transition-colors"
          >
            🔴 CERRAR SESIÓN
          </button>
        </div>

        {/* Updated Notification */}
        {updating && (
          <div className="mt-4 text-center">
            <p className="font-arcade text-[10px] text-cyan-400 animate-pulse">Actualizando...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileScreen;
