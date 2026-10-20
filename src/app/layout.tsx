import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

// Geist stands in for Figma Sans (proprietary); see the design notes.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Breeders — Motion components, ready to copy", template: "%s · Breeders" },
  description: "A free library of motion components. Copy the prompt, take the code, or edit and export it in your browser.",
};

// Runs before paint so the saved theme never flashes. Dark is the default.
const themeScript = `try{var t=localStorage.getItem("breeders-theme");if(t!=="light")document.documentElement.classList.add("dark")}catch(e){document.documentElement.classList.add("dark")}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
