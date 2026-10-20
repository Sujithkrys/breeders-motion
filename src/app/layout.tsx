import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

// Inter is the house face (the premium references use an Inter/SF-style grotesk); the optical-size axis gives large
// type its display cut automatically. Geist Mono is only for tiny labels and numbers.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", axes: ["opsz"] });
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
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
