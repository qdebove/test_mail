import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "GatherPlay | Board game sessions near you",
  description:
    "Organise and discover board game nights using zip code matching, live availability, and interactive maps.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
