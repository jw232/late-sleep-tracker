import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk, DM_Sans } from "next/font/google";
import { Navigation } from "@/components/navigation";
import { Starfield } from "@/components/landing/starfield";
import { LocaleProvider } from "@/hooks/use-locale";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "晚睡记录",
  description: "追踪和改善晚睡习惯",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${dmSans.variable} antialiased`}
      >
        <ThemeProvider>
          <LocaleProvider>
            <Starfield />
            <div className="relative z-10">
              <Navigation />
              {children}
            </div>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
