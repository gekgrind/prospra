import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ProspraMenu from "@/components/ProspraMenu";
import ProfileMenu from "@/components/ProfileMenu";
import PageTransition from "@/components/PageTransition";
import MobileTabBar from "@/components/MobileTabBar";
import CommandPalette from "@/components/CommandPalette";
import ClickSparkProvider from "@/components/ClickSparkProvider";
import AuthLayoutShell from "./AuthLayoutShell"; 

// 👉 Fonts
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

// 👉 Metadata
export const metadata: Metadata = {
  title: "Prospra • Your AI Entrepreneur Mentor",
  description:
    "Prospra gives founders personalized guidance, strategic clarity, and motivational support — powered by Entrepreneuria.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} bg-brandNavyDark text-white min-h-screen`}
    >
      <body className="relative min-h-screen font-sans antialiased">
        <ClickSparkProvider>
          <CommandPalette />
          <AuthLayoutShell>{children}</AuthLayoutShell>
        </ClickSparkProvider>
      </body>
    </html>
  );
}
