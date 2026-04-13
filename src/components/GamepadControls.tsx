import React, { useEffect, useRef, useState } from 'react';

interface GamepadControlsProps {
  gameType: string;
  onKeyDown: (key: string) => void;
  onKeyUp: (key: string) => void;
}

const GamepadControls: React.FC<GamepadControlsProps> = ({ gameType, onKeyDown, onKeyUp }) => {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const activeKeysRef = useRef<Set<string>>(new Set());
  const currentTouchRef = useRef<number | null>(null);

  // Detectar si es móvil
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (!isMobile) return null;

  // Actualizar una key
  const updateKey = (key: string, isActive: boolean) => {
    if (isActive) {
      if (!activeKeysRef.current.has(key)) {
        activeKeysRef.current.add(key);
        setActiveKeys(new Set(activeKeysRef.current));
        onKeyDown(key);
      }
    } else {
      if (activeKeysRef.current.has(key)) {
        activeKeysRef.current.delete(key);
        setActiveKeys(new Set(activeKeysRef.current));
        onKeyUp(key);
      }
    }
  };

  // Limpiar todas las teclas
  const clearAllKeys = () => {
    activeKeysRef.current.forEach((key) => {
      onKeyUp(key);
    });
    activeKeysRef.current.clear();
    setActiveKeys(new Set());
  };

  // ===== JOYSTICK =====
  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    const isTouch = 'touches' in e;
    if (isTouch && (e as React.TouchEvent).touches.length > 0) {
      currentTouchRef.current = (e as React.TouchEvent).touches[0].identifier;
    }

    const handleMove = (moveEvent: TouchEvent | MouseEvent) => {
      if (!joystickRef.current) return;

      // Validar que es el mismo touch
      if (moveEvent instanceof TouchEvent && currentTouchRef.current !== null) {
        const touch = Array.from(moveEvent.touches).find(
          (t) => t.identifier === currentTouchRef.current
        );
        if (!touch) return;
      }

      const rect = joystickRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const clientX =
        moveEvent instanceof TouchEvent
          ? moveEvent.touches[0]?.clientX ?? 0
          : moveEvent.clientX;
      const clientY =
        moveEvent instanceof TouchEvent
          ? moveEvent.touches[0]?.clientY ?? 0
          : moveEvent.clientY;

      let x = clientX - rect.left - centerX;
      let y = clientY - rect.top - centerY;
      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = 40;

      if (distance > maxDistance) {
        const angle = Math.atan2(y, x);
        x = Math.cos(angle) * maxDistance;
        y = Math.sin(angle) * maxDistance;
      }

      setJoystickPos({ x, y });

      // Detectar dirección
      const angle = Math.atan2(y, x) * (180 / Math.PI);
      let direction = '';

      if (distance > 15) {
        // Dead zone
        if (angle > -45 && angle <= 45) {
          direction = 'd'; // Right
        } else if (angle > 45 && angle <= 135) {
          direction = 's'; // Down
        } else if (angle > 135 || angle <= -135) {
          direction = 'a'; // Left
        } else {
          direction = 'w'; // Up
        }
      }

      // Actualizar keys
      ['w', 'a', 's', 'd'].forEach((key) => {
        updateKey(key, key === direction);
      });
    };

    const handleEnd = () => {
      currentTouchRef.current = null;
      setJoystickPos({ x: 0, y: 0 });
      ['w', 'a', 's', 'd'].forEach((key) => updateKey(key, false));

      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
  };

  // ===== ACTION BUTTONS =====
  const createButtonHandlers = (key: string) => ({
    onMouseDown: () => updateKey(key, true),
    onMouseUp: () => updateKey(key, false),
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      updateKey(key, true);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      updateKey(key, false);
    },
    onMouseLeave: () => {
      // Si sale sin soltar, liberar
      if (activeKeysRef.current.has(key)) {
        updateKey(key, false);
      }
    },
  });

  const renderActionButtons = () => {
    switch (gameType) {
      case 'pong':
      case 'snake':
      case 'racing':
        return (
          <div className="flex flex-col gap-2">
            <button
              {...createButtonHandlers('w')}
              className={`w-12 h-12 rounded-lg font-arcade text-sm font-bold transition-all ${
                activeKeys.has('w')
                  ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400'
                  : 'bg-cyan-900 text-cyan-300 border-2 border-cyan-400'
              }`}
            >
              ▲
            </button>
            <button
              {...createButtonHandlers('s')}
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
            {...createButtonHandlers(' ')}
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
            {...createButtonHandlers('w')}
            className={`w-12 h-12 rounded-lg font-arcade text-sm font-bold transition-all ${
              activeKeys.has('w')
                ? 'bg-magenta-400 text-black shadow-lg shadow-magenta-400'
                : 'bg-magenta-900 text-magenta-300 border-2 border-magenta-400'
            }`}
          >
            ROT
          </button>
        );

      case 'wordle':
        return (
          <div className="text-xs text-cyan-300 text-center">
            <p>Use teclado virtual de dispositivo</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t-2 border-cyan-500 p-4 backdrop-blur z-50">
      <div className="max-w-4xl mx-auto h-32 flex items-center justify-between px-4 gap-8">
        {/* Joystick */}
        <div
          ref={joystickRef}
          onMouseDown={handleJoystickStart}
          onTouchStart={handleJoystickStart}
          className="relative w-32 h-32 bg-gray-900 border-2 border-cyan-400 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing flex-shrink-0"
          style={{ touchAction: 'none' }}
        >
          {/* Outer circle */}
          <div className="absolute w-28 h-28 border border-cyan-400/30 rounded-full"></div>

          {/* Joystick ball */}
          <div
            className="absolute w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full shadow-lg shadow-cyan-400/50 transition-transform"
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              pointerEvents: 'none',
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
        <div className="flex items-center justify-center gap-4 flex-1">
          {renderActionButtons()}
        </div>

        {/* Info */}
        <div className="text-center flex-shrink-0">
          <p className="font-arcade text-xs text-cyan-400 mb-2">MOBILE</p>
          <p className="font-arcade text-[10px] text-cyan-300">CONTROLES</p>
        </div>
      </div>
    </div>
  );
};

export default GamepadControls;
