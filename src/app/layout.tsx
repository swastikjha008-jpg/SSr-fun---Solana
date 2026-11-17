import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});
const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk-latin-wght-normal.woff2",
  variable: "--font-space-grotesk",
  weight: "300 700",
  display: "swap",
});

export const viewport: Viewport = { themeColor: "#050914", colorScheme: "dark" };

export const metadata: Metadata = {
  title: "Reserve with Intent | SSR.FUN Beta Challenge",
  description:
    "An independent companion presentation for the SSR.FUN beta launch challenge on Superteam Earn. Not an official SSR.FUN site.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Reserve with Intent | SSR.FUN Beta Challenge",
    description: "Conviction-driven portfolios, transparent allocation and beta feedback for the SSR.FUN beta launch challenge.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
      <body>
        <a
          href="#overview"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:text-[#050914]"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
