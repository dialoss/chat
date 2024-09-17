import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import "../styles/scrollbar.css";
import { Providers } from "@/components/layout/Providers";

const inter = Inter({  subsets: ['latin', 'cyrillic']});

export const metadata: Metadata = {
  title: "Чатик",
  description: "Чатик",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Chat Rooms",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
 
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
