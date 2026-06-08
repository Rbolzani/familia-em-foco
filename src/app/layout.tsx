import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// DM Sans — corpo e UI
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// Gilda Display — títulos display (carregada via Google Fonts CDN no CSS)
// next/font não tem Gilda Display, usamos fallback via CSS @import
const gildaClass = "--font-gilda";

export const metadata: Metadata = {
  title: "Família em Foco",
  description: "Sua assistente pessoal para tudo que envolve seus filhos",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Família em Foco" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#7B6FE8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`h-full antialiased ${dmSans.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gilda+Display&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root { --font-gilda: 'Gilda Display', Georgia, serif; }
        `}</style>
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
