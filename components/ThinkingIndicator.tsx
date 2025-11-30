import React from 'react';
import { Loader2, BrainCircuit } from 'lucide-react';

interface ThinkingIndicatorProps {
  isDeepThinking: boolean;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ isDeepThinking }) => {
  return (
    <div className="flex items-center space-x-3 p-4 bg-white/50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 animate-pulse w-fit max-w-md transition-colors duration-300">
      {isDeepThinking ? (
        <BrainCircuit className="w-5 h-5 text-purple-600 dark:text-purple-500 animate-pulse" />
      ) : (
        <Loader2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500 animate-spin" />
      )}
      <div className="flex flex-col">
        <span className={`text-sm font-semibold ${isDeepThinking ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {isDeepThinking ? 'Deep Reasoning Active' : 'Processing...'}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          {isDeepThinking ? 'Analyzing complex patterns & logic...' : 'Generating response...'}
        </span>
      </div>
    </div>
  );
};