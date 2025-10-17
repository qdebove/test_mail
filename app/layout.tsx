import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "POC Magic Link",
  description: "NextAuth + Resend + Tailwind",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
