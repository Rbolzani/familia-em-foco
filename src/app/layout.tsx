import type { Metadata, Viewport } from "next";
import { DM_Sans, Lora } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/layout/ServiceWorkerRegistrar";
import PwaInstallBanner from "@/components/layout/PwaInstallBanner";

// DM Sans — corpo e UI
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// Lora — títulos display
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Família em Dia",
  description: "Sua assistente pessoal para tudo que envolve seus filhos",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Família em Dia" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2C4A2E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`h-full antialiased ${dmSans.variable} ${lora.variable}`}>
      <body className="min-h-full">
        {/* Captura beforeinstallprompt antes da hydration do React */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window._pwaInstallPrompt = e;
          });
        `}} />
        <ServiceWorkerRegistrar />
        <PwaInstallBanner />
        {children}
      </body>
    </html>
  );
}
