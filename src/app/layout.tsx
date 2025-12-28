
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SideNav } from '@/components/side-nav';
import { ThemeProvider } from '@/components/theme-provider';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { Toaster } from '@/components/toaster';
import { ErrorBoundary } from '@/components/error-boundary';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Generador de Reportes',
  description: 'Un nuevo proyecto para generar reportes.',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen w-full">
            <SideNav />
            <main className="flex-1 bg-muted/30 sm:pl-14">
              <ErrorBoundary name="MainContent">
                {children}
              </ErrorBoundary>
            </main>
          </div>
          <WelcomeDialog />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
