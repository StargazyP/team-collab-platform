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
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SessionCheck />
        {children}
      </body>
    </html>
  );
}
