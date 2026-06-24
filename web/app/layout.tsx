import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simify Asset Library",
  description: "Browse, download, and generate every Simify icon, graphic and image.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
