'use client';

import React from 'react';
import { NotificationBell } from '@/components/layout/notification-bell';
import { useMobileNav } from './mobile-nav/use-mobile-nav';
import { NavBrand } from './mobile-nav/nav-brand';
import { NavUserMenu } from './mobile-nav/nav-user-menu';

export function MobileNav() {
  const {
    profile,
    analyst,
    displayName,
    displayDepartment,
    initials
  } = useMobileNav();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/90 backdrop-blur-md px-3 sm:hidden shadow-sm shadow-black/5 animate-in slide-in-from-top duration-500 ease-out">
      {/* Branding (SRP) */}
      <NavBrand />

      <div className="flex items-center gap-2">
        {/* Notificaciones */}
        <NotificationBell />

        {/* Menú de Usuario (SRP) */}
        <NavUserMenu
          profile={profile}
          analyst={analyst}
          displayName={displayName}
          displayDepartment={displayDepartment}
          initials={initials}
        />
      </div>
    </header>
  );
}
