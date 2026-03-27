import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "@excalidraw/excalidraw/index.css";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { SkipLink } from "@/components/SkipLink";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { LayoutProvider } from "@/components/layout-provider";
import { AnimatedBackground } from "@/components/AnimatedBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rebinmas Project Management",
  description: "Modern project management tool with Kanban boards for Rebinmas",
};

import { getSession } from "@/lib/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const isAuthenticated = !!session;

  return (
    <html lang="en" className="dark bg-slate-950" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased bg-slate-950 text-slate-50`}
      >
        <ThemeProvider defaultTheme="dark">
          <LayoutProvider defaultLayout="grid">
            <AnimatedBackground />
            <SkipLink />
            <AppShell isAuthenticated={isAuthenticated} userRole={session?.role as string}>{children}</AppShell>
            <Toaster />
          </LayoutProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
