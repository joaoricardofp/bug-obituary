import type { Metadata } from "next";
import { Cinzel, Crimson_Text } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

const crimsonText = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bug Obituary",
  description: "A graveyard for bugs that have been fixed.",
  openGraph: {
    title: "Bug Obituary",
    description: "A graveyard for bugs that have been fixed.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${crimsonText.variable} h-full`}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
