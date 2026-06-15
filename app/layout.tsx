import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "KU Phumpanya",
  description: "Research discovery platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
