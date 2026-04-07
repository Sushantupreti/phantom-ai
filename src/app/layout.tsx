import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Phantom AI — Your Invisible Interview Copilot",
  description:
    "The AI that listens, sees your screen, and whispers perfect answers — completely invisible during screen sharing. Ace every interview with your phantom advantage.",
  keywords: [
    "AI interview copilot",
    "invisible interview assistant",
    "real-time interview help",
    "screen share invisible",
    "interview AI tool",
    "phantom AI",
  ],
  openGraph: {
    title: "Phantom AI — Your Invisible Interview Copilot",
    description:
      "Invisible. Intelligent. Unstoppable. The AI copilot that no one can see but you.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#050510] text-[#e4e4f0]">
        {children}
      </body>
    </html>
  );
}
