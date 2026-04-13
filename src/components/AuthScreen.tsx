import React, { useState, useEffect, useCallback } from 'react';
import { AuthManager } from '../services/AuthManager';
import { AvatarManager } from '../services/AvatarManager';
import { soundManager } from '../engine/SoundManager';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [usernameStatus, setUsernameStatus] = useState<'available' | 'taken' | 'checking' | 'invalid' | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');

  // Validate username (debounced)
  useEffect(() => {
    if (!regUsername) {
      setUsernameStatus(null);
      setUsernameMessage('');
      return;
    }

    // Validate format
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(regUsername)) {
      setUsernameStatus('invalid');
      setUsernameMessage('3-16 characters: letters, numbers, underscores only');
      return;
    }

    const checkTimeout = setTimeout(async () => {
      setUsernameStatus('checking');
      const available = await AuthManager.checkUsernameAvailability(regUsername);
      if (available) {
        setUsernameStatus('available');
        setUsernameMessage(`✅ "${regUsername}" is available`);
      } else {
        setUsernameStatus('taken');
        setUsernameMessage(`❌ "${regUsername}" is already taken`);
      }
    }, 500);

    return () => clearTimeout(checkTimeout);
  }, [regUsername]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await AuthManager.login(loginEmail, loginPassword);
      soundManager.victory();
      onAuthSuccess();
    } catch (err: any) {
      soundManager.death();
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!regEmail || !regPassword || !regUsername) {
      setError('All fields are required');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,16}$/.test(regUsername)) {
      setError('Username must be 3-16 characters (letters, numbers, underscores)');
      return;
    }

    if (usernameStatus !== 'available') {
      setError('Username is not available');
      return;
    }

    setLoading(true);

    try {
      await AuthManager.register(regEmail, regPassword, regUsername, selectedAvatar);
      soundManager.victory();
      onAuthSuccess();
    } catch (err: any) {
      soundManager.death();
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (direction: number) => {
    setSelectedAvatar((prev) => (prev + direction + 8) % 8);
    soundManager.menuSelect();
  };

  const renderAvatarPreview = () => {
    const canvas = React.useRef<HTMLCanvasElement>(null);
    useEffect(() => {
      if (canvas.current) {
        AvatarManager.drawAvatar(canvas.current, selectedAvatar);
      }
    }, [selectedAvatar]);
    return canvas;
  };

  const AvatarCanvas = React.forwardRef<HTMLCanvasElement>((_, ref) => {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      if (canvasRef.current) {
        AvatarManager.drawAvatar(canvasRef.current, selectedAvatar);
      }
    }, [selectedAvatar]);

    return (
      <canvas
        ref={canvasRef}
        className="w-24 h-24 border-2 border-cyan-400 rounded-lg bg-black mx-auto"
        style={{ imageRendering: 'pixelated' }}
      />
    );
  });

  AvatarCanvas.displayName = 'AvatarCanvas';

  return (
    <div className="scanlines min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      <div className="relative z-10 w-full max-w-md px-6 crt-on">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="glitch-text font-arcade text-3xl text-primary mb-2" data-text="PIXEL DUEL">
            PIXEL DUEL
          </h1>
          <p className="font-arcade text-[10px] text-muted-foreground">ONLINE MULTIPLAYER</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-cyan-400 pb-2">
          <button
            onClick={() => {
              soundManager.menuSelect();
              setTab('login');
              setError('');
            }}
            className={`flex-1 py-2 text-sm font-arcade transition-colors ${
              tab === 'login'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-500 hover:text-cyan-400'
            }`}
          >
            INICIAR SESIÓN
          </button>
          <button
            onClick={() => {
              soundManager.menuSelect();
              setTab('register');
              setError('');
            }}
            className={`flex-1 py-2 text-sm font-arcade transition-colors ${
              tab === 'register'
                ? 'text-magenta-400 border-b-2 border-magenta-400'
                : 'text-gray-500 hover:text-magenta-400'
            }`}
          >
            REGISTRARSE
          </button>
        </div>

        {/* Login Tab */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-arcade text-[10px] text-cyan-400 mb-2">
                EMAIL O #NÚMERO
              </label>
              <input
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="tu@email.com o #0042"
                className="w-full px-3 py-2 bg-gray-900 border border-cyan-400 rounded text-sm font-body
                           text-white placeholder-gray-600 focus:outline-none focus:border-cyan-300 focus:shadow-lg
                           focus:shadow-cyan-400/50"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block font-arcade text-[10px] text-cyan-400 mb-2">CONTRASEÑA</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-gray-900 border border-cyan-400 rounded text-sm font-body
                           text-white placeholder-gray-600 focus:outline-none focus:border-cyan-300 focus:shadow-lg
                           focus:shadow-cyan-400/50"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500 rounded text-red-400 text-xs font-body">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full neon-btn text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ ENTRANDO...' : '▶ ENTRAR'}
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!loginEmail) {
                  setError('Ingresa tu email');
                  return;
                }
                try {
                  await AuthManager.resetPassword(loginEmail);
                  setError('');
                  alert('Se ha enviado un correo de recuperación');
                } catch (err: any) {
                  setError(err.message);
                }
              }}
              className="w-full py-2 text-[10px] font-arcade text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              ¿OLVIDASTE TU CONTRASEÑA?
            </button>
          </form>
        )}

        {/* Register Tab */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block font-arcade text-[10px] text-magenta-400 mb-2">EMAIL</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-3 py-2 bg-gray-900 border border-magenta-400 rounded text-sm font-body
                           text-white placeholder-gray-600 focus:outline-none focus:border-magenta-300 focus:shadow-lg
                           focus:shadow-magenta-400/50"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block font-arcade text-[10px] text-magenta-400 mb-2">NOMBRE DE JUGADOR</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value.toLowerCase())}
                placeholder="xX_DragonSlayer_Xx"
                maxLength={16}
                className="w-full px-3 py-2 bg-gray-900 border border-magenta-400 rounded text-sm font-body
                           text-white placeholder-gray-600 focus:outline-none focus:border-magenta-300 focus:shadow-lg
                           focus:shadow-magenta-400/50"
                disabled={loading}
              />
              {usernameMessage && (
                <p
                  className={`text-[10px] font-arcade mt-1 ${
                    usernameStatus === 'available'
                      ? 'text-lime-400'
                      : usernameStatus === 'taken'
                        ? 'text-red-400'
                        : usernameStatus === 'checking'
                          ? 'text-yellow-400 animate-pulse'
                          : 'text-yellow-400'
                  }`}
                >
                  {usernameMessage}
                </p>
              )}
            </div>

            <div>
              <label className="block font-arcade text-[10px] text-magenta-400 mb-2">CONTRASEÑA (6+ caracteres)</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-gray-900 border border-magenta-400 rounded text-sm font-body
                           text-white placeholder-gray-600 focus:outline-none focus:border-magenta-300 focus:shadow-lg
                           focus:shadow-magenta-400/50"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block font-arcade text-[10px] text-magenta-400 mb-2">CONFIRMAR CONTRASEÑA</label>
              <input
                type="password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-gray-900 border border-magenta-400 rounded text-sm font-body
                           text-white placeholder-gray-600 focus:outline-none focus:border-magenta-300 focus:shadow-lg
                           focus:shadow-magenta-400/50"
                disabled={loading}
              />
            </div>

            {/* Avatar Selection */}
            <div className="border border-magenta-400 rounded p-4 bg-gray-900">
              <label className="block font-arcade text-[10px] text-magenta-400 mb-3 text-center">ELIGE TU AVATAR</label>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => handleAvatarChange(-1)}
                  disabled={loading}
                  className="text-2xl hover:scale-110 transition-transform disabled:opacity-50"
                >
                  ◀
                </button>
                <AvatarCanvas />
                <button
                  type="button"
                  onClick={() => handleAvatarChange(1)}
                  disabled={loading}
                  className="text-2xl hover:scale-110 transition-transform disabled:opacity-50"
                >
                  ▶
                </button>
              </div>
              <p className="text-center font-arcade text-[10px] text-magenta-300 mt-2">
                {AvatarManager.getAvatarEmoji(selectedAvatar)} {AvatarManager.getAvatarName(selectedAvatar)}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500 rounded text-red-400 text-xs font-body">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || usernameStatus !== 'available'}
              className="w-full neon-btn text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: usernameStatus === 'available' ? '#ff00ff' : '#666' }}
            >
              {loading ? '⏳ CREANDO...' : '▶ CREAR CUENTA'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
