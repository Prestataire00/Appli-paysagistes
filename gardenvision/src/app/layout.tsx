import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "GardenVision — Visualisez vos projets paysagers",
  description:
    "Générez des visualisations avant/après de vos espaces extérieurs grâce à l'IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="antialiased bg-[#F9FBF7] text-[#1C1C1C] min-h-screen">
        {children}
      </body>
    </html>
  );
}
