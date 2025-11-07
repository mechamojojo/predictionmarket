import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Megabolsa - Maior bolsa de opiniões do Brasil",
  description:
    "Opiniões sobre tudo que está acontecendo no país, notícias, cultura, política, fofoca, esportes, tecnologia e mais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased font-sans`}>
        <ThirdwebProvider>{children}</ThirdwebProvider>
        <Toaster />
      </body>
    </html>
  );
}
