import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MainSidebar from "@/components/layout/MainSidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "App de Reportes",
  description: "Aplicación para generar y visualizar reportes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex h-screen bg-gray-100`}
      >
        <MainSidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
