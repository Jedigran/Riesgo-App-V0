/**
 * ============================================================================
 * ROOT LAYOUT - Aplicación RiesgoApp
 * ============================================================================
 * 
 * Layout principal de la aplicación con SessionProvider para gestión de estado.
 * Envuelve toda la aplicación con el contexto de sesión.
 * 
 * @module app/layout
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/src/lib/state/SessionContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RiesgoApp - Mapeo de Riesgos Industriales",
  description: "Aplicación educativa para mapeo visual de riesgos industriales (HAZOP, FMEA, LOPA, OCA)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider autoIniciar={true}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
