import type { Metadata } from "next";
import { UserProvider } from "@/lib/UserContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "KU Phumpanya",
  description: "Research discovery platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('ku-theme')||'dark';document.documentElement.setAttribute('data-theme',t);})()`,
          }}
        />
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
