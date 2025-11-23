/**
 * First Message Celebration Component
 * Shows a delightful animation when user sends first message
 */

import { useEffect, useState } from 'react';

interface FirstMessageCelebrationProps {
  show: boolean;
  onComplete: () => void;
}

export default function FirstMessageCelebration({
  show,
  onComplete,
}: FirstMessageCelebrationProps) {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    if (show) {
      // Generate random particles
      setParticles(Array.from({ length: 12 }, (_, i) => i));

      // Auto-hide after animation
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {/* Center message */}
      <div className="animate-spring-bounce">
        <div className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl shadow-lg">
          <p className="text-lg font-semibold">🎉 첫 대화를 시작했어요!</p>
        </div>
      </div>

      {/* Floating particles */}
      {particles.map((i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const distance = 100 + Math.random() * 50;
        // Position calculations for potential future use
        Math.cos(angle) * distance; // x
        Math.sin(angle) * distance; // y
        const delay = i * 50;

        return (
          <div
            key={i}
            className="absolute text-2xl animate-spring-bounce"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%)`,
              animation: `float${i} 2s ease-out forwards`,
              animationDelay: `${delay}ms`,
            }}
          >
            {['🎊', '✨', '🌟', '💫'][i % 4]}
          </div>
        );
      })}

      <style>{`
        ${particles.map((i) => {
          const angle = (i / particles.length) * Math.PI * 2;
          const distance = 100 + Math.random() * 50;
          const x = Math.cos(angle) * distance;
          const y = Math.sin(angle) * distance;

          return `
            @keyframes float${i} {
              0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 0;
              }
              50% {
                opacity: 1;
              }
              100% {
                transform: translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.5);
                opacity: 0;
              }
            }
          `;
        }).join('\n')}
      `}</style>
    </div>
  );
}
