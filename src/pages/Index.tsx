import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ParticlesBg from '../components/ParticlesBg';
import GameSelector from '../components/GameSelector';
import GameCanvas from '../components/GameCanvas';
import WordleGame from '../components/WordleGame';
import Scoreboard from '../components/Scoreboard';
import AuthScreen from '../components/AuthScreen';
import OnlineLobby from '../components/OnlineLobby';
import ProfileScreen from '../components/ProfileScreen';
import WaitingForGame from '../components/WaitingForGame';
import WaitingForInviteAccept from '../components/WaitingForInviteAccept';
import JoinGameWithLink from '../components/JoinGameWithLink';
import OnlineGameConnection from '../components/OnlineGameConnection';
import type { GameId } from '../components/GameCanvas';
import { soundManager } from '../engine/SoundManager';
import { useAuth } from '../context/AuthContext';
import { PresenceManager } from '../services/PresenceManager';
import { AuthManager } from '../services/AuthManager';

type Screen = 'menu' | 'auth' | 'online-lobby' | 'profile' | 'select' | 'select-online' | 'waiting-for-game' | 'waiting-for-invite-accept' | 'join-with-link' | 'connecting-online' | 'playing' | 'records';

interface IndexProps {
  isJoiningWithLink?: boolean;
}

const Index: React.FC<IndexProps> = ({ isJoiningWithLink = false }) => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null);
  const [gameMode, setGameMode] = useState<'local' | 'online'>('local');
  const [winner, setWinner] = useState<1 | 2 | 0 | null>(null);
  const [volume, setVolume] = useState(50);
  const [muted, setMuted] = useState(false);
  const [onlineInviteId, setOnlineInviteId] = useState<string | null>(null);
  const [onlineRoomCode, setOnlineRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [opponentUsername, setOpponentUsername] = useState('');
  const [opponentNumber, setOpponentNumber] = useState(0);
  const [sentInviteRoomCode, setSentInviteRoomCode] = useState<string | null>(null);
  const [sentInviteId, setSentInviteId] = useState<string | null>(null);
  const [sentTargetUsername, setSentTargetUsername] = useState('');
  const [sentTargetNumber, setSentTargetNumber] = useState(0);

  useEffect(() => {
    if (!authLoading && !user && screen === 'menu') {
      // User can browse menu without login
    }
  }, [user, authLoading, screen]);

  // Handle joining with link
  useEffect(() => {
    if (isJoiningWithLink && roomCode && user) {
      setScreen('join-with-link');
    }
  }, [isJoiningWithLink, roomCode, user]);

  useEffect(() => {
    if (!user || !profile) return;

    const updatePresence = async () => {
      try {
        if (screen === 'playing' && selectedGame) {
          await PresenceManager.updatePresence(user.uid, {
            status: 'in-game',
            currentGame: selectedGame
          });
        } else if (user && screen !== 'connecting-online') {
          await PresenceManager.updatePresence(user.uid, {
            status: 'online',
            currentGame: null
          });
        }
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    };

    updatePresence();
  }, [screen, selectedGame, user, profile]);

  const goToMenu = () => {
    setScreen('menu');
    setSelectedGame(null);
    setWinner(null);
    setOnlineInviteId(null);
    setOnlineRoomCode(null);
    setIsHost(false);
    setOpponentUsername('');
    setOpponentNumber(0);
    setSentInviteRoomCode(null);
    setSentInviteId(null);
    setSentTargetUsername('');
    setSentTargetNumber(0);
  };

  const handleSelectGame = async (game: GameId) => {
    setSelectedGame(game);
    setWinner(null);
    soundManager.gameStart();
    setScreen('playing');
  };

  const handleGameEnd = useCallback((w: 1 | 2 | 0) => {
    setWinner(w);
    if (w !== 0) soundManager.victory();
    else soundManager.death();

    if (user && profile && gameMode === 'online') {
      if (w === 1) {
        AuthManager.updateProfile(user.uid, {
          wins: profile.wins + 1,
          gamesPlayed: profile.gamesPlayed + 1
        });
      } else if (w === 2) {
        AuthManager.updateProfile(user.uid, {
          losses: profile.losses + 1,
          gamesPlayed: profile.gamesPlayed + 1
        });
      } else {
        AuthManager.updateProfile(user.uid, {
          gamesPlayed: profile.gamesPlayed + 1
        });
      }
    }
  }, [user, profile, gameMode]);

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    soundManager.setVolume(v / 100);
  };

  const toggleMute = () => {
    const m = soundManager.toggleMute();
    setMuted(m);
  };

  const handleOnlineInviteAccepted = (inviteId: string, roomCode: string, inviterUsername?: string, inviterNumber?: number) => {
    soundManager.victory();
    setOnlineInviteId(inviteId);
    setOnlineRoomCode(roomCode);
    setGameMode('online');
    setIsHost(false); // The one who accepted is GUEST
    setOpponentUsername(inviterUsername || '');
    setOpponentNumber(inviterNumber || 0);
    setScreen('connecting-online');
  };

  const handleInviteSent = (inviteId: string, roomCode: string, targetUsername: string, targetNumber: number) => {
    // El que envía la invitación va DIRECTAMENTE a conectarse como HOST
    soundManager.gameStart();
    setGameMode('online');
    setIsHost(true);
    setOpponentUsername(targetUsername);
    setOpponentNumber(targetNumber);
    setOnlineRoomCode(roomCode);
    setOnlineInviteId(inviteId);
    setScreen('connecting-online');
  };

  const handleInviteAcceptedAsHost = () => {
    // When the sent invite is accepted, prepare to connect as HOST
    if (!sentInviteRoomCode) return;

    soundManager.victory();
    setGameMode('online');
    setIsHost(true); // The one who sent is HOST
    setOpponentUsername(sentTargetUsername);
    setOpponentNumber(sentTargetNumber);
    setOnlineRoomCode(sentInviteRoomCode);
    setScreen('connecting-online');
  };

  if (!authLoading && !user && screen !== 'menu' && screen !== 'records') {
    return (
      <AuthScreen
        onAuthSuccess={() => {
          setScreen('menu');
        }}
      />
    );
  }

  if (screen === 'menu') {
    return (
      <div className="scanlines min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <ParticlesBg />
        <div className="relative z-10 flex flex-col items-center gap-8 crt-on">
          <h1 className="glitch-text font-arcade text-3xl md:text-5xl text-primary tracking-wider" data-text="PIXEL DUEL">
            PIXEL DUEL
          </h1>
          <p className="font-arcade text-[10px] text-muted-foreground tracking-widest">
            6 GAMES · 2 PLAYERS · 0 LIMITS
          </p>

          <div className="flex flex-col gap-4 mt-8">
            <button
              className="neon-btn"
              onClick={() => {
                soundManager.menuSelect();
                setGameMode('local');
                setScreen('select');
              }}
            >
              ▶ PLAY LOCAL
            </button>
            <button
              className="neon-btn"
              onClick={() => {
                soundManager.menuSelect();
                if (!user) {
                  setScreen('auth');
                } else {
                  setGameMode('online');
                  setScreen('online-lobby');
                }
              }}
            >
              🌐 PLAY ONLINE
            </button>
            <button
              className="neon-btn"
              onClick={() => {
                soundManager.menuSelect();
                setScreen('records');
              }}
            >
              🏆 RECORDS
            </button>

            {user && (
              <button
                className="neon-btn text-sm opacity-75 hover:opacity-100"
                onClick={() => {
                  soundManager.menuSelect();
                  setScreen('profile');
                }}
                title="Your Profile"
              >
                👤 PROFILE
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              className="font-arcade text-xs text-muted-foreground hover:text-primary transition-colors"
              onClick={toggleMute}
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-24"
            />
          </div>

          <p className="text-muted-foreground text-xs font-body mt-8 opacity-40">
            PixelDuel v1.0 · Built with React + Canvas
          </p>
        </div>
      </div>
    );
  }

  if (screen === 'auth') {
    return (
      <AuthScreen
        onAuthSuccess={() => {
          setScreen('online-lobby');
        }}
      />
    );
  }

  if (screen === 'online-lobby' && user && profile) {
    return (
      <OnlineLobby
        onBack={goToMenu}
        onInviteAccepted={handleOnlineInviteAccepted}
        onInviteSent={handleInviteSent}
      />
    );
  }

  if (screen === 'waiting-for-invite-accept' && sentInviteRoomCode && sentInviteId) {
    return (
      <WaitingForInviteAccept
        inviteId={sentInviteId}
        targetUsername={sentTargetUsername}
        targetNumber={sentTargetNumber}
        roomCode={sentInviteRoomCode}
        onAccepted={handleInviteAcceptedAsHost}
        onBack={goToMenu}
      />
    );
  }

  if (screen === 'join-with-link') {
    return (
      <JoinGameWithLink
        onInviteAccepted={handleOnlineInviteAccepted}
        onCancel={goToMenu}
      />
    );
  }

  if (screen === 'connecting-online' && onlineRoomCode) {
    return (
      <OnlineGameConnection
        roomCode={onlineRoomCode}
        isHost={isHost}
        opponentUsername={opponentUsername}
        onConnected={() => {
          setScreen(isHost ? 'select-online' : 'waiting-for-game');
        }}
        onError={(error) => {
          console.error('Connection error:', error);
          soundManager.death();
        }}
        onCancel={goToMenu}
      />
    );
  }

  if (screen === 'waiting-for-game' && !isHost) {
    return (
      <WaitingForGame
        opponentUsername={opponentUsername}
        opponentNumber={opponentNumber}
        onCancel={goToMenu}
      />
    );
  }

  if (screen === 'profile' && user && profile) {
    return (
      <ProfileScreen
        onBack={goToMenu}
        onLogout={goToMenu}
      />
    );
  }

  if (screen === 'select' || screen === 'select-online') {
    return (
      <div className="scanlines min-h-screen flex items-center justify-center bg-background">
        <GameSelector
          onSelect={handleSelectGame}
          onBack={goToMenu}
        />
      </div>
    );
  }

  if (screen === 'records') {
    return (
      <div className="scanlines min-h-screen flex items-center justify-center bg-background">
        <Scoreboard onBack={goToMenu} />
      </div>
    );
  }

  if (screen === 'playing' && selectedGame) {
    return (
      <div className="scanlines min-h-screen flex flex-col items-center justify-center bg-background p-4 gap-4">
        <div className="w-full max-w-4xl flex items-center justify-between font-arcade text-xs px-4">
          <span className="text-primary">PLAYER 1</span>
          <span className="text-foreground">{selectedGame.toUpperCase()}</span>
          <span className="text-secondary">PLAYER 2</span>
        </div>

        {winner !== null ? (
          <div className="flex flex-col items-center gap-6 crt-on">
            <h2
              className="glitch-text font-arcade text-2xl"
              data-text={
                winner === 0
                  ? 'DRAW!'
                  : gameMode === 'online'
                    ? `YOU ${winner === 1 ? 'WIN' : 'LOSE'}!`
                    : `PLAYER ${winner} WINS!`
              }
              style={{
                color:
                  winner === 1
                    ? '#00ffff'
                    : winner === 2
                      ? '#ff00ff'
                      : '#ffff00'
              }}
            >
              {winner === 0
                ? 'DRAW!'
                : gameMode === 'online'
                  ? `YOU ${winner === 1 ? 'WIN' : 'LOSE'}!`
                  : `PLAYER ${winner} WINS!`}
            </h2>
            <div className="flex gap-4">
              <button
                className="neon-btn"
                onClick={() => {
                  setWinner(null);
                  setSelectedGame(selectedGame);
                }}
              >
                REMATCH
              </button>
              <button
                className="neon-btn"
                onClick={() => setScreen(gameMode === 'online' ? 'select-online' : 'select')}
              >
                OTHER GAME
              </button>
              <button className="neon-btn" onClick={goToMenu}>
                MENU
              </button>
            </div>
          </div>
        ) : selectedGame === 'wordle' ? (
          <WordleGame onEnd={handleGameEnd} />
        ) : (
          <GameCanvas game={selectedGame} onEnd={handleGameEnd} />
        )}

        {winner === null && (
          <button
            className="neon-btn text-[8px] mt-2"
            onClick={goToMenu}
          >
            EXIT TO MENU
          </button>
        )}
      </div>
    );
  }

  return null;
};

export default Index;
