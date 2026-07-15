import type { Metadata } from "next";
import { Inter, Noto_Sans_Sinhala, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const sinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  variable: "--font-sinhala",
  weight: ["400", "700"],
});

const tamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  variable: "--font-tamil",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "GovPilot AI — Sri Lankan Citizen Services Platform",
  description:
    "Fast, accessible, and automated passport renewal services for Sri Lankan citizens. Verified and tracked end-to-end.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", "font-sans", inter.variable)}>
      <body
        className={`${inter.variable} ${sinhala.variable} ${tamil.variable} font-sans min-h-dvh flex flex-col bg-govbg`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
