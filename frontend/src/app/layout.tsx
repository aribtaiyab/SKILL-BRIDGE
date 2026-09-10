import type { Metadata } from "next";
import { Suspense } from "react";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { DemoProvider } from "@/lib/demo/demo-context";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
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
    <html lang="en" className={`${manrope.variable} antialiased h-full`}>
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
