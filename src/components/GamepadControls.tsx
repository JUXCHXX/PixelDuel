import React, { useEffect, useRef, useState } from 'react';

interface GamepadControlsProps {
  gameType: string;
  onKeyDown: (key: string) => void;
  onKeyUp: (key: string) => void;
}

const GamepadControls: React.FC<GamepadControlsProps> = ({ gameType, onKeyDown, onKeyUp }) => {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (!isMobile) return null;

  // Actualizar keys activas
  const updateActiveKey = (key: string, isActive: boolean) => {
    setActiveKeys(prev => {
      const newSet = new Set(prev);
      if (isActive) {
        newSet.add(key);
        onKeyDown(key);
      } else {
        newSet.delete(key);
        onKeyUp(key);
      }
      return newSet;
    });
  };

  // Joystick handling
  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    const container = joystickRef.current;
    if (!container) return;

    // Para touch, obtener el touch ID
    if ('touches' in e) {
      touchIdRef.current = e.touches[0].identifier;
    }

    const handleMove = (moveEvent: TouchEvent | MouseEvent) => {
      const container = joystickRef.current;
      if (!container) return;

      // Validar que es el mismo touch (para múltiples touches)
      if ('touches' in moveEvent && touchIdRef.current !== null) {
        let touchFound = false;
        for (let i = 0; i < moveEvent.touches.length; i++) {
          if (moveEvent.touches[i].identifier === touchIdRef.current) {
            touchFound = true;
            break;
          }
        }
        if (!touchFound) return;
      }

      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;

      const x = clientX - rect.left - centerX;
      const y = clientY - rect.top - centerY;
      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = 40;

      let constrainedX = x;
      let constrainedY = y;

      if (distance > maxDistance) {
        const angle = Math.atan2(y, x);
        constrainedX = Math.cos(angle) * maxDistance;
        constrainedY = Math.sin(angle) * maxDistance;
      }

      setJoystickPos({ x: constrainedX, y: constrainedY });

      // Determinar dirección
      const angle = Math.atan2(constrainedY, constrainedX) * (180 / Math.PI);
      let newDirection = '';

      if (distance > 10) {
        // Dead zone de 10px
        if (angle > -45 && angle <= 45) {
          newDirection = 'd'; // Right
        } else if (angle > 45 && angle <= 135) {
          newDirection = 's'; // Down
        } else if (angle > 135 || angle <= -135) {
          newDirection = 'a'; // Left
        } else {
          newDirection = 'w'; // Up
        }
      }

      // Actualizar keys activas
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        const directionKeys = ['w', 'a', 's', 'd'];

        // Remover direcciones anteriores
        directionKeys.forEach(key => {
          if (newSet.has(key) && key !== newDirection) {
            newSet.delete(key);
            onKeyUp(key);
          }
        });

        // Agregar nueva dirección
        if (newDirection && !newSet.has(newDirection)) {
          newSet.add(newDirection);
          onKeyDown(newDirection);
        }

        return newSet;
      });
    };

    const handleEnd = () => {
      touchIdRef.current = null;
      setJoystickPos({ x: 0, y: 0 });

      // Remover todos los keys de dirección
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        ['w', 'a', 's', 'd'].forEach(key => {
          if (newSet.has(key)) {
            newSet.delete(key);
            onKeyUp(key);
          }
        });
        return newSet;
      });

      document.removeEventListener('mousemove', handleMove as any);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove as any);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove as any);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove as any, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  // Botones de acción
  const handleButtonDown = (key: string) => {
    updateActiveKey(key, true);
  };

  const handleButtonUp = (key: string) => {
    updateActiveKey(key, false);
  };

  const renderActionButtons = () => {
    switch (gameType) {
      case 'pong':
        return (
          <div className="flex flex-col gap-2">
            <button
              onMouseDown={() => handleButtonDown('w')}
              onMouseUp={() => handleButtonUp('w')}
              onTouchStart={() => handleButtonDown('w')}
              onTouchEnd={() => handleButtonUp('w')}
              className={`w-12 h-12 rounded-lg font-arcade text-sm font-bold transition-all ${
                activeKeys.has('w')
                  ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400'
                  : 'bg-cyan-900 text-cyan-300 border-2 border-cyan-400'
              }`}
            >
              ▲
            </button>
            <button
              onMouseDown={() => handleButtonDown('s')}
              onMouseUp={() => handleButtonUp('s')}
              onTouchStart={() => handleButtonDown('s')}
              onTouchEnd={() => handleButtonUp('s')}
              className={`w-12 h-12 rounded-lg font-arcade text-sm font-bold transition-all ${
                activeKeys.has('s')
                  ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400'
                  : 'bg-cyan-900 text-cyan-300 border-2 border-cyan-400'
              }`}
            >
              ▼
            </button>
          </div>
        );

      case 'bomberman':
        return (
          <button
            onMouseDown={() => handleButtonDown(' ')}
            onMouseUp={() => handleButtonUp(' ')}
            onTouchStart={() => handleButtonDown(' ')}
            onTouchEnd={() => handleButtonUp(' ')}
            className={`w-16 h-16 rounded-full font-arcade text-2xl font-bold transition-all ${
              activeKeys.has(' ')
                ? 'bg-orange-400 text-black shadow-lg shadow-orange-400'
                : 'bg-orange-900 text-orange-300 border-2 border-orange-400'
            }`}
          >
            💣
          </button>
        );

      case 'tetris':
        return (
          <button
            onMouseDown={() => handleButtonDown('w')}
            onMouseUp={() => handleButtonUp('w')}
            onTouchStart={() => handleButtonDown('w')}
            onTouchEnd={() => handleButtonUp('w')}
            className={`w-12 h-12 rounded-lg font-arcade text-sm font-bold transition-all ${
              activeKeys.has('w')
                ? 'bg-magenta-400 text-black shadow-lg shadow-magenta-400'
                : 'bg-magenta-900 text-magenta-300 border-2 border-magenta-400'
            }`}
          >
            ROT
          </button>
        );

      case 'racing':
        return (
          <button
            onMouseDown={() => handleButtonDown('w')}
            onMouseUp={() => handleButtonUp('w')}
            onTouchStart={() => handleButtonDown('w')}
            onTouchEnd={() => handleButtonUp('w')}
            className={`w-12 h-12 rounded-lg font-arcade text-xs font-bold transition-all ${
              activeKeys.has('w')
                ? 'bg-red-400 text-black shadow-lg shadow-red-400'
                : 'bg-red-900 text-red-300 border-2 border-red-400'
            }`}
          >
            GAS
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t-2 border-cyan-500 p-4 backdrop-blur z-50">
      <div className="max-w-4xl mx-auto h-32 flex items-center justify-between px-4">
        {/* Joystick */}
        <div
          ref={joystickRef}
          onMouseDown={handleJoystickStart}
          onTouchStart={handleJoystickStart}
          className="relative w-32 h-32 bg-gray-900 border-2 border-cyan-400 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        >
          {/* Outer circle */}
          <div className="absolute w-28 h-28 border border-cyan-400/30 rounded-full"></div>

          {/* Joystick ball */}
          <div
            className="absolute w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full shadow-lg shadow-cyan-400/50 transition-transform"
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              pointerEvents: 'none'
            }}
          ></div>

          {/* Direction indicators */}
          <div className="absolute text-cyan-400/40 font-arcade text-xs font-bold pointer-events-none select-none">
            <div className="absolute top-1 left-1/2 -translate-x-1/2">▲</div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2">▼</div>
            <div className="absolute left-1 top-1/2 -translate-y-1/2">◄</div>
            <div className="absolute right-1 top-1/2 -translate-y-1/2">►</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4">
          {renderActionButtons()}
        </div>

        {/* Info */}
        <div className="text-center">
          <p className="font-arcade text-xs text-cyan-400 mb-2">MOBILE</p>
          <p className="font-arcade text-[10px] text-cyan-300">JOYSTICK + ACTION</p>
        </div>
      </div>
    </div>
  );
};

export default GamepadControls;
