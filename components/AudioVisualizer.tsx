import React from 'react';

export const AudioVisualizer: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-[2px] h-4 mx-2">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-1 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-wave"
          style={{
            height: '100%',
            animation: `wave 0.8s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          0%, 100% { height: 20%; opacity: 0.5; }
          50% { height: 100%; opacity: 1; }
        }
        .animate-wave {
           animation-name: wave;
        }
      `}</style>
    </div>
  );
};