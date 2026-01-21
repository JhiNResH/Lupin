import type { Metadata } from "next";
import { Space_Grotesk, Noto_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Lupin | Truth Investigator",
  description:
    "The Truth Engine for restaurant reviews. Combat fake influencer hype with AI-powered analysis.",
  keywords: [
    "restaurant reviews",
    "truth score",
    "fake reviews",
    "AI analysis",
    "Lupin",
  ],
  openGraph: {
    title: "Lupin | Truth Investigator",
    description: "Uncovering the truth behind restaurant reviews",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${notoSans.variable} antialiased`}
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
