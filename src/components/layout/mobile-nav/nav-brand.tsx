import React from 'react';

export const NavBrand = () => {
  return (
    <div className="flex items-center gap-2.5 font-semibold flex-1 min-w-0 pr-1">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
        <img src="/icons/icon-192x192.png" alt="App Icon" className="h-5 w-5 object-contain" />
      </div>
      <span className="text-xl font-bold tracking-tight text-foreground truncate">
        Minutas
      </span>
    </div>
  );
};
