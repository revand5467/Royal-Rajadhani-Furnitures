import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Rajadhani Furniture — Solid wood furniture in Vattiyoorkavu, Kerala",
    template: "%s — Rajadhani Furniture",
  },
  description:
    "Rajadhani Furniture is a furniture shop in Vattiyoorkavu, Kerala, offering solid teak, mango wood and rosewood pieces for the Indian home. Browse the collection or visit the showroom.",
  applicationName: "Rajadhani Furniture",
  keywords: [
    "furniture",
    "furniture shop Kerala",
    "teak furniture",
    "mango wood furniture",
    "solid wood furniture",
    "Vattiyoorkavu",
    "furniture showroom",
  ],
  openGraph: {
    type: "website",
    siteName: "Rajadhani Furniture",
    title: "Rajadhani Furniture — Solid wood furniture in Vattiyoorkavu, Kerala",
    description:
      "Solid teak, mango wood and rosewood furniture for Indian homes. Browse the collection or visit the showroom in Vattiyoorkavu, Kerala.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Rajadhani Furniture — Solid wood furniture in Vattiyoorkavu, Kerala",
    description: "Solid teak, mango wood and rosewood furniture for Indian homes.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fbf9f6",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
