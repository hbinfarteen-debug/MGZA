import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Make Great Zimbabwe Again — Political Strategy Game",
  description: "A political and economic simulation game set in a fictional version of Zimbabwe. Build your political career from Councillor to President while navigating the complexities of governance.",
  keywords: ["strategy game", "political simulation", "zimbabwe", "governance", "indie game"],
  authors: [{ name: "MGZA Studios" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Make Great Zimbabwe Again",
    description: "Political Strategy Game — Can you lead the nation to prosperity?",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Make Great Zimbabwe Again",
    description: "Political Strategy Game",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
