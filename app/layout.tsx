import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalkulator Hari Telat | Lion Parcel",
  description:
    "Web statis untuk menghitung batas maksimal hari telat bulanan berdasarkan total shift efektif dan target kedisiplinan minimum 85%.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
