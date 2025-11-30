import React from 'react';

export const CipherAvatar: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="coreGradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <filter id="glow-avatar" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Outer rotating ring segments */}
    <circle cx="50" cy="50" r="45" stroke="url(#coreGradient)" strokeWidth="1" strokeOpacity="0.3" />
    <path d="M50 5 A45 45 0 0 1 95 50" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
    <path d="M50 95 A45 45 0 0 1 5 50" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />

    {/* Inner geometric core */}
    <path 
      d="M50 20 L76 35 V65 L50 80 L24 65 V35 Z" 
      fill="#064e3b" 
      fillOpacity="0.3" 
      stroke="url(#coreGradient)" 
      strokeWidth="2"
    />
    
    {/* Central Energy Source */}
    <circle cx="50" cy="50" r="8" fill="#ecfdf5" filter="url(#glow-avatar)">
      {/* @ts-ignore */}
      <animate attributeName="opacity" values="0.8;1;0.8" duration="3s" repeatCount="indefinite" />
    </circle>
    
    {/* Connection Lines */}
    <path d="M50 20 L50 42" stroke="#34d399" strokeWidth="2" />
    <path d="M76 65 L57 54" stroke="#34d399" strokeWidth="2" />
    <path d="M24 65 L43 54" stroke="#34d399" strokeWidth="2" />
  </svg>
);
