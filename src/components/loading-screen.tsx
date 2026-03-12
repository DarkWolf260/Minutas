'use client';

import React from 'react';
import { Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message?: string;
  isOverlay?: boolean;
}

export function LoadingScreen({ message, isOverlay = false }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center z-50 transition-all duration-500",
        isOverlay 
          ? "fixed inset-0 bg-background/80 backdrop-blur-md" 
          : "min-h-screen bg-background"
      )}
    >
      <div className="relative">
        {/* Glowing Background Effect */}
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse scale-150" />
        
        {/* Rotating Rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 rounded-full border-t-2 border-primary/40 border-r-2 border-transparent animate-[spin_3s_linear_infinite]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-20 w-20 rounded-full border-b-2 border-primary/60 border-l-2 border-transparent animate-[spin_2s_linear_infinite_reverse]" />
        </div>

        {/* Core Icon */}
        <div className="relative bg-background p-5 rounded-full border border-primary/20 shadow-2xl flex items-center justify-center overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/10 opacity-50 group-hover:opacity-100 transition-opacity" />
          <Database className="h-10 w-10 text-primary animate-bounce shadow-inner" style={{ animationDuration: '2s' }} />
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-700">
          {message || 'Iniciando Sistema'}
        </h2>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
        </div>
      </div>

      {/* Subtle bottom text */}
      {!isOverlay && (
        <p className="absolute bottom-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 font-medium">
          Minutas Admin • v0.1.0
        </p>
      )}
    </div>
  );
}
