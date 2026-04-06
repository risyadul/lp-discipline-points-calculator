import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

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
    <html lang="id" className={`${inter.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
