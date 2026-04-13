import React, { useEffect, useState } from 'react';
import { PresenceManager, PresenceData } from '../services/PresenceManager';
import { InviteManager } from '../services/InviteManager';
import { AuthManager } from '../services/AuthManager';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { AvatarManager } from '../services/AvatarManager';
import { soundManager } from '../engine/SoundManager';

interface OnlineLobbyProps {
  onBack: () => void;
  onInviteAccepted: (inviteId: string, roomCode: string, fromUsername?: string, fromNumber?: number) => void;
  onInviteSent?: (inviteId: string, roomCode: string, targetUsername: string, targetNumber: number) => void;
}

const OnlineLobby: React.FC<OnlineLobbyProps> = ({ onBack, onInviteAccepted, onInviteSent }) => {
  const { user, profile } = useAuth();
  const { addNotification } = useNotification();
  const [players, setPlayers] = useState<PresenceData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [invitingSentTo, setInvitingSentTo] = useState<Map<string, boolean>>(new Map());
  const [pendingInvites, setPendingInvites] = useState<Map<string, { expiresAt: number }>>(new Map());
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [sharingInviteData, setSharingInviteData] = useState<{
    inviteId: string;
    roomCode: string;
    targetUsername: string;
    targetNumber: number;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = PresenceManager.listenToPresence((presences) => {
      // Filter offline players and sort
      const online = presences
        .filter((p) => p.status !== undefined)
        .sort((a, b) => {
          if (a.status === 'online' && b.status !== 'online') return -1;
          if (a.status !== 'online' && b.status === 'online') return 1;
          return a.userNumber - b.userNumber;
        });
      setPlayers(online);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Listen to received invites
  useEffect(() => {
    if (!user) return;

    const unsubscribe = InviteManager.listenToReceivedInvites(user.uid, async (invites) => {
      invites.forEach((invite) => {
        if (invite.status === 'pending') {
          const timeLeft = (invite.expiresAt - Date.now()) / 1000;

          if (timeLeft > 0) {
            addNotification({
              type: 'invite-received',
              title: `${invite.from.username} te invita a jugar`,
              duration: invite.expiresAt - Date.now(),
              data: {
                fromUsername: invite.from.username,
                fromUserNumber: invite.from.userNumber,
                fromAvatar: invite.from.avatar,
                inviteId: invite.id
              },
              actions: [
                {
                  label: '✅ ACEPTAR',
                  onClick: async () => {
                    try {
                      const roomCode = await InviteManager.acceptInvite(invite.id);
                      if (profile) {
                        await PresenceManager.updatePresence(user.uid, {
                          status: 'in-game',
                          currentGame: null
                        });
                      }
                      onInviteAccepted(
                        invite.id,
                        roomCode,
                        invite.from.username,
                        invite.from.userNumber
                      );
                    } catch (err) {
                      console.error('Error accepting invite:', err);
                    }
                  },
                  variant: 'primary'
                },
                {
                  label: '❌ RECHAZAR',
                  onClick: async () => {
                    try {
                      await InviteManager.declineInvite(invite.id);
                      soundManager.death();
                      addNotification({
                        type: 'invite-declined',
                        title: 'Invitación rechazada',
                        duration: 3000
                      });
                    } catch (err) {
                      console.error('Error declining invite:', err);
                    }
                  },
                  variant: 'danger'
                }
              ]
            });
          } else {
            // Invite expired
            InviteManager.expireInvite(invite.id);
          }
        }
      });
    });

    return unsubscribe;
  }, [user, profile, addNotification, onInviteAccepted]);

  // Monitor sent invites expiration
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newExpired = Array.from(pendingInvites.entries())
        .filter(([, data]) => data.expiresAt < now)
        .map(([id]) => id);

      if (newExpired.length > 0) {
        setPendingInvites((prev) => {
          const updated = new Map(prev);
          newExpired.forEach((id) => updated.delete(id));
          return updated;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingInvites]);

  const handleInvite = async (targetPlayer: PresenceData) => {
    if (!user || !profile) return;

    soundManager.menuSelect();
    setInvitingSentTo((prev) => new Map(prev).set(targetPlayer.uid, true));

    try {
      const targetProfile = await AuthManager.getProfile(targetPlayer.uid);
      if (!targetProfile) {
        throw new Error('Could not load target profile');
      }

      // sendInvite now returns { inviteId, roomCode }
      const { inviteId, roomCode } = await InviteManager.sendInvite(profile, targetPlayer.uid, targetProfile);

      // Generate share link
      const inviteLink = `${window.location.origin}/join/${roomCode}`;
      setShareLink(inviteLink);
      setSharingInviteData({
        inviteId,
        roomCode,
        targetUsername: targetPlayer.username,
        targetNumber: targetPlayer.userNumber
      });
      setShareModalOpen(true);
      setShareLinkCopied(false);

      // Auto-clear invite sending state after a bit
      setTimeout(() => {
        setInvitingSentTo((prev) => {
          const updated = new Map(prev);
          updated.delete(targetPlayer.uid);
          return updated;
        });
      }, 3000);
    } catch (error: any) {
      console.error('Error sending invite:', error);
      soundManager.death();
      setInvitingSentTo((prev) => {
        const updated = new Map(prev);
        updated.delete(targetPlayer.uid);
        return updated;
      });
      addNotification({
        type: 'error',
        title: 'Error al enviar invitación',
        message: error.message,
        duration: 5000
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareLinkCopied(true);
      soundManager.victory();

      // Auto-hide after 2 seconds
      setTimeout(() => {
        setShareLinkCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Error copying link:', err);
      soundManager.death();
    }
  };

  const handleStartWaitingForGuest = () => {
    if (!sharingInviteData) return;

    soundManager.gameStart();
    setShareModalOpen(false);

    // Call onInviteSent so HOST goes directly to connecting-online
    if (onInviteSent) {
      onInviteSent(
        sharingInviteData.inviteId,
        sharingInviteData.roomCode,
        sharingInviteData.targetUsername,
        sharingInviteData.targetNumber
      );
    }

    setSharingInviteData(null);
  };

  const filteredPlayers = players.filter((player) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const numberMatch = query.match(/^#?(\d+)$/);

    if (numberMatch) {
      return player.userNumber === parseInt(numberMatch[1]);
    }

    return player.username.toLowerCase().includes(query);
  });

  return (
    <div className="scanlines min-h-screen flex flex-col items-center bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500 to-magenta-500" />
      </div>

      <div className="relative z-10 w-full max-w-2xl p-6">
        {/* Share Modal Overlay */}
        {shareModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border-2 border-cyan-400 rounded-lg p-8 max-w-md w-full space-y-6">
              <div className="text-center">
                <h2 className="font-arcade text-xl text-cyan-400 mb-2">ENLACE DE INVITACIÓN</h2>
                <p className="font-arcade text-xs text-cyan-300">Comparte este enlace con tu oponente</p>
              </div>

              {/* Link Display */}
              <div className="bg-black border border-cyan-400 rounded p-4 font-arcade text-xs text-cyan-300 break-all">
                {shareLink}
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopyLink}
                className={`w-full px-4 py-3 rounded font-arcade text-sm transition-all ${
                  shareLinkCopied
                    ? 'bg-green-900 text-green-100 border-2 border-green-400'
                    : 'bg-cyan-900 text-cyan-100 border-2 border-cyan-400 hover:bg-cyan-800'
                }`}
              >
                {shareLinkCopied ? '✓ ENLACE COPIADO' : '📋 COPIAR ENLACE'}
              </button>

              {/* Start Waiting Button */}
              <button
                onClick={handleStartWaitingForGuest}
                className="w-full neon-btn text-sm"
              >
                ✓ IR A SALA
              </button>

              {/* Close Button */}
              <button
                onClick={() => setShareModalOpen(false)}
                className="w-full px-4 py-2 rounded font-arcade text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                ← Cancelar
              </button>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="glitch-text font-arcade text-3xl text-cyan-400 mb-2" data-text="JUGADORES ONLINE">
            JUGADORES ONLINE
          </h1>
          <p className="font-arcade text-xs text-cyan-300">( {filteredPlayers.length} jugadores )</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o #número..."
            className="w-full px-4 py-2 bg-gray-900 border-2 border-cyan-400 rounded text-sm font-body
                     text-white placeholder-gray-600 focus:outline-none focus:border-cyan-300 focus:shadow-lg
                     focus:shadow-cyan-400/50"
          />
        </div>

        {/* Player List */}
        <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <p className="font-arcade text-cyan-400 animate-pulse">Cargando jugadores...</p>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-arcade text-gray-500">No hay jugadores en línea</p>
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const isOwnUser = profile?.uid === player.uid;
              const isInvitingNow = invitingSentTo.get(player.uid);
              const hasExpiredInvite = pendingInvites.has(player.uid);
              const canInvite = player.status === 'online' && !isOwnUser;

              return (
                <div
                  key={player.uid}
                  className={`
                    flex items-center gap-3 p-3 rounded border-2 transition-all
                    ${
                      isOwnUser
                        ? 'border-cyan-400 bg-cyan-900/20'
                        : 'border-gray-700 hover:border-cyan-400 bg-gray-900/50 hover:bg-gray-800/50'
                    }
                  `}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 flex-shrink-0">
                    <canvas
                      className="w-full border border-gray-600 bg-black"
                      style={{ imageRendering: 'pixelated' }}
                      ref={(canvas) => {
                        if (canvas) AvatarManager.drawAvatar(canvas, player.avatar);
                      }}
                    />
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-arcade text-xs text-cyan-300">#{String(player.userNumber).padStart(4, '0')}</span>
                      <span className="font-arcade text-sm text-white truncate">{player.username}</span>
                      {isOwnUser && <span className="text-[10px] text-cyan-400">(TÚ)</span>}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`
                        text-2xl
                        ${player.status === 'online' ? '🟢' : player.status === 'in-game' ? '🎮' : '⚪'}
                      `}
                    />
                    <span
                      className={`
                        font-arcade text-[10px]
                        ${player.status === 'online' ? 'text-lime-400' : player.status === 'in-game' ? 'text-yellow-400' : 'text-gray-500'}
                      `}
                    >
                      {player.status === 'online'
                        ? 'Online'
                        : player.status === 'in-game'
                          ? 'En juego'
                          : 'Away'}
                    </span>
                  </div>

                  {/* Invite Button */}
                  {!isOwnUser && (
                    <button
                      onClick={() => handleInvite(player)}
                      disabled={!canInvite || isInvitingNow || hasExpiredInvite}
                      className={`
                        px-3 py-1 rounded text-xs font-arcade transition-all flex-shrink-0
                        ${
                          canInvite
                            ? 'bg-magenta-900 hover:bg-magenta-800 text-magenta-100 cursor-pointer'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                        }
                        ${isInvitingNow ? 'animate-pulse' : ''}
                      `}
                    >
                      {isInvitingNow ? '⏳' : hasExpiredInvite ? '✓' : '📨'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={() => {
              soundManager.menuSelect();
              onBack();
            }}
            className="flex-1 neon-btn text-sm"
          >
            ← VOLVER AL MENÚ
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnlineLobby;
