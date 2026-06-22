import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Abhaya_Libre, Poppins } from "next/font/google";
import "./globals.css";

const abhayaLibre = Abhaya_Libre({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-abhaya",
});

const poppins = Poppins({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "KU Phumpanya",
  description: "Research discovery platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${abhayaLibre.variable} ${poppins.variable}`}>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
