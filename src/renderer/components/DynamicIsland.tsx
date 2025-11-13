/**
 * Dynamic Island Component
 * macOS-style animated notification for screen tracking events
 */

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

interface DynamicIslandProps {
  show: boolean;
  action: 'started' | 'stopped' | 'idle-warning';
  interval?: number;
  idleDuration?: number;
  onDismiss?: () => void;
  onAction?: () => void;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  show,
  action,
  interval = 10,
  idleDuration,
  onDismiss,
  onAction,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Entrance animation
      setIsVisible(true);
      setTimeout(() => setIsExpanded(true), 100);

      // Auto-collapse after 3 seconds
      const collapseTimer = setTimeout(() => {
        setIsExpanded(false);
      }, 3000);

      // Auto-dismiss after 4 seconds
      const dismissTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(), 500);
      }, 4000);

      return () => {
        clearTimeout(collapseTimer);
        clearTimeout(dismissTimer);
      };
    } else {
      setIsVisible(false);
      setIsExpanded(false);
      return undefined;
    }
  }, [show, onDismiss]);

  if (!isVisible) return null;

  const getContent = () => {
    switch (action) {
      case 'started':
        return {
          icon: <Eye className="w-5 h-5 text-green-400" />,
          title: '화면 추적 시작',
          message: `${interval}초 간격으로 자동 캡처`,
          bgColor: 'from-green-500/10 to-green-600/10',
          borderColor: 'border-green-500/30',
        };
      case 'stopped':
        return {
          icon: <EyeOff className="w-5 h-5 text-gray-400" />,
          title: '화면 추적 중지',
          message: '자동 캡처가 비활성화되었습니다',
          bgColor: 'from-gray-500/10 to-gray-600/10',
          borderColor: 'border-gray-500/30',
        };
      case 'idle-warning':
        return {
          icon: <XCircle className="w-5 h-5 text-amber-400" />,
          title: '화면 추적 알림',
          message: `${idleDuration}분 동안 추적이 비활성화되어 있습니다`,
          bgColor: 'from-amber-500/10 to-amber-600/10',
          borderColor: 'border-amber-500/30',
          showAction: true,
        };
      default:
        return {
          icon: <CheckCircle className="w-5 h-5 text-blue-400" />,
          title: '알림',
          message: '',
          bgColor: 'from-blue-500/10 to-blue-600/10',
          borderColor: 'border-blue-500/30',
        };
    }
  };

  const content = getContent();

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <div
        className={`
          transition-all duration-500 ease-out
          ${isExpanded ? 'w-96' : 'w-24'}
          ${isExpanded ? 'h-20' : 'h-10'}
          ${isExpanded ? 'rounded-3xl' : 'rounded-full'}
          bg-gradient-to-r ${content.bgColor}
          backdrop-blur-xl
          border ${content.borderColor}
          shadow-2xl shadow-black/50
          overflow-hidden
          pointer-events-auto
        `}
      >
        <div className="w-full h-full flex items-center justify-center px-6 py-3">
          {/* Collapsed state - just icon */}
          {!isExpanded && (
            <div className="flex items-center justify-center animate-pulse">
              {content.icon}
            </div>
          )}

          {/* Expanded state - full content */}
          {isExpanded && (
            <div className="flex items-center gap-4 w-full animate-in fade-in duration-300">
              <div className="flex-shrink-0">
                {content.icon}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
                  {content.title}
                </h3>
                <p className="text-xs text-gray-400 truncate">
                  {content.message}
                </p>
              </div>

              {content.showAction && (
                <button
                  onClick={() => {
                    onAction?.();
                    setIsVisible(false);
                    setTimeout(() => onDismiss?.(), 300);
                  }}
                  className="flex-shrink-0 px-3 py-1 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  시작
                </button>
              )}
            </div>
          )}
        </div>

        {/* Progress bar animation */}
        {isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-progress"
              style={{
                animation: 'progress 3s linear forwards',
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes progress {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(100%);
          }
        }

        @keyframes animate-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-in {
          animation: animate-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

/**
 * Hook for managing Dynamic Island notifications
 */
export const useDynamicIsland = () => {
  const [notification, setNotification] = useState<{
    show: boolean;
    action: 'started' | 'stopped' | 'idle-warning';
    interval?: number;
    idleDuration?: number;
  } | null>(null);

  const showNotification = (
    action: 'started' | 'stopped' | 'idle-warning',
    options?: { interval?: number; idleDuration?: number }
  ) => {
    setNotification({
      show: true,
      action,
      ...options,
    });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return {
    notification,
    showNotification,
    hideNotification,
  };
};
