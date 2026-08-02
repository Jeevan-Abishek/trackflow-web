import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { LanguageProvider } from "@/lib/i18n/language-context";

const display = Sora({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "TrackFlow — Live GPS tracking, shared in one link",
  description:
    "Start a live GPS session and share a secure link. Anyone with the link watches the position move in real time — no app required.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="bg-mist font-sans text-ink antialiased">
        <ServiceWorkerRegister />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
