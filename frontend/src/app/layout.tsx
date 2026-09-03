import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { DemoProvider } from "@/lib/demo/demo-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SkillBridge Connect",
  description: "Assess. Improve. Prove. Connect.",
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
