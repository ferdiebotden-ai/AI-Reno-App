import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/header";
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
  title: {
    default: "Red White Reno | Stratford Renovation Contractor",
    template: "%s | Red White Reno",
  },
  description:
    "Professional renovation services in Stratford, Ontario. Kitchen, bathroom, and whole-home renovations with AI-powered project visualization.",
  keywords: [
    "renovation",
    "contractor",
    "Stratford",
    "Ontario",
    "kitchen renovation",
    "bathroom renovation",
    "home improvement",
  ],
  authors: [{ name: "Red White Reno" }],
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Red White Reno",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
