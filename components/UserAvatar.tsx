import React from 'react';

export const UserAvatar: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
       <filter id="neon-glow-user" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    {/* Outer decorative ring */}
    <circle cx="50" cy="50" r="46" stroke="white" strokeWidth="1" opacity="0.3" strokeDasharray="4 4">
        {/* @ts-ignore */}
        <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" duration="30s" repeatCount="indefinite" />
    </circle>

    {/* Stylized 'U' Text Animation */}
    <path 
      d="M32 32 V58 Q32 75 50 75 Q68 75 68 58 V32" 
      stroke="white" 
      strokeWidth="5" 
      strokeLinecap="round" 
      filter="url(#neon-glow-user)"
      strokeDasharray="120"
      strokeDashoffset="120"
    >
       {/* @ts-ignore */}
       <animate attributeName="stroke-dashoffset" values="120;0;0;120" keyTimes="0;0.4;0.7;1" duration="5s" repeatCount="indefinite" />
    </path>
    
    {/* Glowing particles at tips */}
    <circle cx="32" cy="32" r="3" fill="white">
         {/* @ts-ignore */}
         <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.7;1" duration="5s" repeatCount="indefinite" />
    </circle>
    <circle cx="68" cy="32" r="3" fill="white">
         {/* @ts-ignore */}
         <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.3;0.5;1" duration="5s" repeatCount="indefinite" />
    </circle>
  </svg>
);
