import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { DemoProvider } from "@/lib/demo/demo-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillBridge Connect — Career Intelligence Platform",
  description: "Assess your skills against real career requirements, identify gaps, improve with AI coaching, and connect with verified opportunities.",
  keywords: ["skill assessment", "career readiness", "skill gap", "career intelligence"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased h-full`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <Suspense fallback={null}>
          <DemoProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </DemoProvider>
        </Suspense>
      </body>
    </html>
  );
}
