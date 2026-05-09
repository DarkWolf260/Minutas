import React from 'react';

export const NavBrand = () => {
  return (
    <div className="flex items-center gap-3 font-semibold flex-1 min-w-0">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)] shrink-0">
        <img src="/icons/icon-192x192.png" alt="App Icon" className="h-6 w-6 object-contain" />
      </div>
      <span className="text-2xl font-bold tracking-tight text-foreground truncate">
        Minutas
      </span>
    </div>
  );
};
