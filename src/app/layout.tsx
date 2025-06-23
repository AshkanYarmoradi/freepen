import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import AnimatePresenceWrapper from "@/components/ui/AnimatePresenceWrapper";
import { Navigation } from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#4F46E5",
};

export const metadata: Metadata = {
  title: "freepen - Secure Chat Rooms",
  description: "A secure chat application with private rooms",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "freepen",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png" },
    ],
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
        suppressHydrationWarning
      >
        <UserProvider>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-1">
              <AnimatePresenceWrapper mode="wait">
                {children}
              </AnimatePresenceWrapper>
            </main>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
