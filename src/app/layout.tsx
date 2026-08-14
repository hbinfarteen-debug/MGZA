import type { Metadata } from "next";
import { Geist, Geist_Mono, Anton, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Make Great Zimbabwe Again — Political Strategy Game",
  description: "A political and economic simulation game set in a fictional version of Zimbabwe. Take office as President, govern through 44 turns, and survive re-election while navigating the complexities of governance.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} ${jakarta.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
