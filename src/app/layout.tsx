import "@/app/globals.css";

import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";

import { SmoothScroll } from "@/components/smooth-scroll";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "TransitOps — Smart Transport Operations",
  description:
    "Fleet logistics platform for companies to manage vehicles, drivers, trips, maintenance, fuel, and operational costs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
      >
        <ThemeProvider>
          <SmoothScroll>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
