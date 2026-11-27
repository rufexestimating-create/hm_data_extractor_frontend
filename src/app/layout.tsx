import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HM Data Extractor",
  description: "Extract business data from any directory page",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${inter.className} h-full antialiased`} suppressHydrationWarning>
      <body className="h-full">{children}</body>
    </html>
  );
}
