import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SideNav } from '@/components/side-nav';
import { MobileNav } from '@/components/mobile-nav';
import { ThemeProvider } from '@/components/theme-provider';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { Toaster } from '@/components/toaster';
import { ErrorBoundary } from '@/components/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PWARegistration } from '@/components/pwa-registration';
import { PWAStatus } from '@/components/pwa-status';

import { DatabaseProvider } from '@/lib/db/db-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Minutas - Gestión Operativa',
  description: 'Sistema administrativo de reportes de novedades operativas.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Minutas',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DatabaseProvider>
            <TooltipProvider>
              <div className="flex min-h-screen w-full flex-col sm:flex-row" suppressHydrationWarning>
                <SideNav />
                <div className="flex flex-1 flex-col sm:pl-14">
                  <MobileNav />
                  <main className="flex-1 bg-muted/30 p-0 sm:p-0">
                    <ErrorBoundary name="MainContent">{children}</ErrorBoundary>
                  </main>
                </div>
              </div>
              <WelcomeDialog />
              <PWARegistration />
              <PWAStatus />
              <Toaster />
            </TooltipProvider>
          </DatabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
