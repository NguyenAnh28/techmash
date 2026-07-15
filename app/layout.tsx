import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { DM_Sans } from "next/font/google";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.internmash.com"),
  title: {
    default: "InternMash | Compare Tech Internships",
    template: "%s | InternMash",
  },
  description:
    "Compare and rank tech internship programs head-to-head. Vote on benefits, culture, and prestige to build the ultimate global tech internship leaderboard.",
  keywords: [
    "internmash",
    "intern mash",
    "tech internships",
    "software engineering intern",
    "internship rankings",
    "elo ranking",
    "compare internships",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "InternMash | Compare Tech Internships",
    description:
      "Compare and rank tech internship programs head-to-head. Vote on benefits, culture, and prestige to build the ultimate global tech internship leaderboard.",
    url: "https://www.internmash.com",
    siteName: "InternMash",
    images: [
      {
        url: "/og-image.jpg",
        width: 710,
        height: 710,
        alt: "InternMash tech internship comparison leaderboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InternMash | Compare Tech Internships",
    description:
      "Compare and rank tech internship programs head-to-head. Vote on benefits, culture, and prestige to build the ultimate global tech internship leaderboard.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/internmash-logo.png",
    apple: "/internmash-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} bg-white text-slate-900`}>
        <div className="flex min-h-screen flex-col bg-white">
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
