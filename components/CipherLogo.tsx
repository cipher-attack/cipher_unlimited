import React from 'react';

export const CipherLogo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Outer Hexagonal Enclosure */}
      <path 
        d="M 75 25 L 35 25 L 15 50 L 35 75 L 75 75" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Key Head */}
      <circle 
        cx="40" 
        cy="50" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="6"
      />
      
      {/* Key Shaft */}
      <path 
        d="M 50 50 L 85 50" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round"
      />
      
      {/* Key Teeth */}
      <path 
        d="M 68 50 L 68 62" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round"
      />
      <path 
        d="M 78 50 L 78 58" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round"
      />
    </svg>
  );
};