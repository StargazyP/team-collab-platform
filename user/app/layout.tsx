import type { Metadata } from "next";
import "./globals.css";
import { SessionCheck } from "@/components/SessionCheck";

export const metadata: Metadata = {
  title: "My App",
  description: "Next.js App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="light" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning>
        <SessionCheck />
        {children}
      </body>
    </html>
  );
}
