import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ClickSpark } from "@/components/global/ClickSpark";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Prospra • Your AI Entrepreneur Mentor",
  description:
    "Prospra gives founders personalized guidance, strategic clarity, and motivational support powered by Entrepreneuria.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-brandNavyDark font-sans antialiased text-white">
        <ClickSpark />
        {children}
      </body>
    </html>
  );
}