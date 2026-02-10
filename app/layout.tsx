import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@excalidraw/excalidraw/index.css";
import { AppShell } from "@/components/AppShell";
import { SkipLink } from "@/components/SkipLink";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { LayoutProvider } from "@/components/layout-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rebinmas Project Management",
  description: "Modern project management tool with Kanban boards for Rebinmas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme="dark">
          <LayoutProvider defaultLayout="grid">
            <SkipLink />
            <AppShell>{children}</AppShell>
            <Toaster />
          </LayoutProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
