import type { Metadata } from "next";
import { Lora, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Screenshot Journal — Physical Paperback Edition",
  description:
    "An infinite 2D tactile paperback canvas for visual screenshots, voice notes, and memories powered by Ollama gemma:2b and MongoDB Atlas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#faf7f0] text-[#2d261e] selection:bg-amber-200 selection:text-[#2d261e]">
        {children}
      </body>
    </html>
  );
}
