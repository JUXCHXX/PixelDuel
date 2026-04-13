import React, { useState, useEffect } from 'react';
import { useNotification, Notification } from '../context/NotificationContext';
import { AvatarManager } from '../services/AvatarManager';
import { soundManager } from '../engine/SoundManager';

const NotificationCenter: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 w-full max-w-sm px-4 sm:px-0">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(
    notification.duration ? notification.duration / 1000 : null
  );

  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          onClose();
          return null;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [timeLeft, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'invite-received':
        return '📨';
      case 'invite-accepted':
        return '✅';
      case 'invite-declined':
        return '❌';
      case 'invite-expired':
        return '⏰';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'connection-error':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'invite-received':
      case 'invite-accepted':
      case 'success':
        return 'bg-emerald-900/80 border-emerald-600';
      case 'invite-declined':
      case 'invite-expired':
      case 'error':
      case 'connection-error':
        return 'bg-red-900/80 border-red-600';
      default:
        return 'bg-blue-900/80 border-blue-600';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'invite-received':
      case 'invite-accepted':
      case 'success':
        return 'text-emerald-100';
      case 'invite-declined':
      case 'invite-expired':
      case 'error':
      case 'connection-error':
        return 'text-red-100';
      default:
        return 'text-blue-100';
    }
  };

  // Render invite notification with special UI
  if (
    notification.type === 'invite-received' &&
    notification.data?.fromUsername &&
    notification.data?.fromAvatar !== undefined
  ) {
    return (
      <InviteNotificationPanel
        notification={notification}
        onClose={onClose}
        timeLeft={timeLeft}
      />
    );
  }

  // Regular notification
  return (
    <div
      className={`
        border rounded-lg p-4 shadow-lg backdrop-blur-sm transition-all
        ${getBgColor()}
        animate-slide-down
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{getIcon()}</span>
        <div className="flex-1 min-w-0">
          <h3 className={`font-arcade text-sm ${getTextColor()}`}>{notification.title}</h3>
          {notification.message && (
            <p className={`text-xs mt-1 ${getTextColor()} opacity-90`}>{notification.message}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className={`text-2xl flex-shrink-0 hover:opacity-70 transition-opacity ${getTextColor()}`}
        >
          ×
        </button>
      </div>

      {/* Timer bar */}
      {timeLeft && timeLeft > 0 && (
        <div className="mt-2 h-1 bg-black/30 rounded overflow-hidden">
          <div
            className="h-full bg-current opacity-60 transition-all"
            style={{
              width: `${(timeLeft / (notification.duration! / 1000)) * 100}%`
            }}
          />
        </div>
      )}

      {/* Action buttons */}
      {notification.actions && notification.actions.length > 0 && (
        <div className="flex gap-2 mt-3">
          {notification.actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className={`
                px-3 py-1 rounded text-xs font-arcade transition-colors
                ${
                  action.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : action.variant === 'secondary'
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }
              `}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface InviteNotificationPanelProps {
  notification: Notification;
  onClose: () => void;
  timeLeft: number | null;
}

const InviteNotificationPanel: React.FC<InviteNotificationPanelProps> = ({
  notification,
  onClose,
  timeLeft
}) => {
  return (
    <div className="border-2 border-cyan-400 bg-gray-900/90 rounded-lg p-4 shadow-2xl backdrop-blur-sm animate-slide-down">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-cyan-400 hover:text-cyan-300 text-xl"
      >
        ×
      </button>

      <div className="text-center mb-3">
        <p className="font-arcade text-cyan-400 text-sm">
          👾 {notification.data?.fromUsername || 'Un jugador'} te invita a jugar
        </p>
        <p className="font-arcade text-[10px] text-cyan-300 mt-1">
          #{String(notification.data?.fromUserNumber).padStart(4, '0')}
        </p>
      </div>

      {/* Timer progress */}
      {timeLeft !== null && (
        <div className="mb-3">
          <div className="h-2 bg-black/50 rounded overflow-hidden mb-1">
            <div
              className="h-full bg-cyan-400 transition-all"
              style={{
                width: `${(timeLeft / 30) * 100}%`
              }}
            />
          </div>
          <p className="font-arcade text-[10px] text-cyan-300 text-center">
            ⏱️ {Math.ceil(timeLeft)}s
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {notification.actions?.map((action, idx) => (
          <button
            key={idx}
            onClick={() => {
              soundManager.menuSelect();
              action.onClick();
              onClose();
            }}
            className={`
              flex-1 px-3 py-2 rounded text-xs font-arcade transition-all
              ${
                action.variant === 'danger'
                  ? 'bg-red-900 hover:bg-red-800 text-red-100 border border-red-600'
                  : 'bg-cyan-900 hover:bg-cyan-800 text-cyan-100 border border-cyan-600'
              }
            `}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NotificationCenter;
