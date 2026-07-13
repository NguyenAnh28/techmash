import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { HeaderNav } from "@/components/HeaderNav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TechMash",
  description: "Vote on tech companies and watch Elo rankings update.",
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
      <body className={inter.className}>
        <div className="min-h-screen">
          <HeaderNav />
          {children}
        </div>
      </body>
    </html>
  );
}
