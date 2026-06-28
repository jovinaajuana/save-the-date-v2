import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Save the Date — Justine & Mike",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
