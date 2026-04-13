import React, { useEffect, useState } from 'react';
import { GameSyncManager } from '../services/GameSyncManager';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../engine/SoundManager';

interface OnlineGameConnectionProps {
  roomCode: string;
  isHost: boolean;
  opponentUsername: string;
  onConnected: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const OnlineGameConnection: React.FC<OnlineGameConnectionProps> = ({
  roomCode,
  isHost,
  opponentUsername,
  onConnected,
  onError,
  onCancel
}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'waiting' | 'connected' | 'error'>('waiting');
  const [errorMsg, setErrorMsg] = useState('');
  const [opponentConnected, setOpponentConnected] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let unsubscribe: (() => void) | null = null;
    let roomListener: (() => void) | null = null;
    let timeoutTimer: NodeJS.Timeout;

    const initializeConnection = async () => {
      try {
        if (!user) {
          throw new Error('Usuario no autenticado');
        }

        if (isHost) {
          // HOST: Create session and listen for guest
          console.log('HOST: Creando sesión con código:', roomCode);
          await GameSyncManager.createGameSession(roomCode, user.uid);
          console.log('HOST: Sesión confirmada en Firebase');
          soundManager.gameStart();
          setStatus('waiting');

          // Listen for guest joining
          unsubscribe = GameSyncManager.listenToGameSession(roomCode, (sessionData) => {
            console.log('HOST: Datos de sala:', sessionData);
            if (sessionData.guest && sessionData.status === 'ready') {
              console.log('GUEST conectó y sala está lista');
              setOpponentConnected(true);
              soundManager.victory();

              timeout = setTimeout(() => {
                setStatus('connected');
                onConnected();
              }, 1000);
            }
          });
        } else {
          // GUEST: Listen for room to appear with status='waiting'
          console.log('GUEST: Escuchando por la sala con código:', roomCode);

          // Set 30-second timeout for safety
          timeoutTimer = setTimeout(() => {
            if (roomListener) {
              roomListener();
            }
            setStatus('error');
            setErrorMsg('No se encontró la sala. Verifica el código o pide al host que cree una nueva.');
            onError('No se encontró la sala. Verifica el código o pide al host que cree una nueva.');
            console.log('GUEST: Timeout - sala no encontrada después de 30s');
          }, 30000);

          // Listen for room creation with real-time updates
          let roomFound = false;
          roomListener = GameSyncManager.listenToGameSession(roomCode, async (sessionData) => {
            console.log('GUEST: Estado actual de la sala:', sessionData);

            // Check if room exists and is waiting
            if (!roomFound && sessionData.status === 'waiting') {
              console.log('GUEST: Sala encontrada con status=waiting, intentando unirse...');
              roomFound = true;

              try {
                // Join the room
                await GameSyncManager.joinGameSession(roomCode, user.uid);
                console.log('GUEST: Unido exitosamente');
                soundManager.victory();

                // Stop listening after successful join
                if (roomListener) {
                  roomListener();
                }
                if (timeoutTimer) {
                  clearTimeout(timeoutTimer);
                }

                timeout = setTimeout(() => {
                  setStatus('connected');
                  onConnected();
                }, 500);
              } catch (err: any) {
                console.error('Error al unirse:', err);
                setStatus('error');
                setErrorMsg(err?.message || 'Error al unirse a la sala');
                onError(err?.message || 'Error al unirse a la sala');
              }
            }
          });
        }
      } catch (err: any) {
        console.error('Error en conexión:', err);
        setStatus('error');
        const errMsg = err?.message || 'Error al conectar';
        setErrorMsg(errMsg);
        onError(errMsg);
      }
    };

    initializeConnection();

    return () => {
      clearTimeout(timeout);
      clearTimeout(timeoutTimer);
      if (unsubscribe) {
        unsubscribe();
      }
      if (roomListener) {
        roomListener();
      }
    };
  }, [roomCode, isHost, user, onConnected, onError]);

  return (
    <div className="scanlines min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500 to-magenta-500" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md">
        {/* Room code display for HOST */}
        {isHost && (
          <div className="border-2 border-cyan-400 rounded-lg p-6 bg-gray-900/50 w-full text-center">
            <p className="font-arcade text-[10px] text-cyan-400 mb-2">CÓDIGO DE SALA</p>
            <p className="font-arcade text-4xl text-cyan-300 tracking-widest font-bold">{roomCode}</p>
            <p className="font-arcade text-[10px] text-cyan-500 mt-4">Dale este código a {opponentUsername}</p>
          </div>
        )}

        {/* Status */}
        {status === 'waiting' && (
          <>
            <h1 className="glitch-text font-arcade text-3xl text-cyan-400" data-text="ESPERANDO">
              ESPERANDO
            </h1>
            <p className="font-arcade text-cyan-300 text-center">
              {isHost ? `Esperando a que ${opponentUsername} se conecte...` : `Conectando con ${opponentUsername}...`}
            </p>
            <div className="flex gap-2 items-center">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>

            {isHost && opponentConnected && (
              <p className="font-arcade text-green-400 text-sm animate-pulse">✓ ¡{opponentUsername} conectado!</p>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="glitch-text font-arcade text-3xl text-red-400" data-text="ERROR">
              ERROR
            </h1>
            <div className="text-4xl">❌</div>
            <p className="font-arcade text-red-300 text-center text-sm">{errorMsg}</p>
            <button onClick={onCancel} className="neon-btn mt-4">
              ← VOLVER
            </button>
          </>
        )}

        {/* Cancel button */}
        {status === 'waiting' && (
          <button onClick={onCancel} className="neon-btn text-sm">
            ← CANCELAR
          </button>
        )}
      </div>
    </div>
  );
};

export default OnlineGameConnection;


