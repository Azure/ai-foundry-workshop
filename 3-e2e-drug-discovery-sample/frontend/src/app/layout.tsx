import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "../components/ui/theme-provider";
import "./globals.css";
import { MainLayout } from '../components/layout/main-layout'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Drug Discovery AI",
  description: "AI-powered drug discovery platform for molecular analysis and clinical trials",
};

// Add 3DMol.js via CDN
const thirdPartyScripts = [
  {
    src: "https://3dmol.csb.pitt.edu/build/3Dmol-min.js",
    integrity: "",
    crossOrigin: "anonymous",
  },
] as const;

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {thirdPartyScripts.map((script, index) => (
          <script
            key={index}
            src={script.src}
            integrity={script.integrity}
            crossOrigin={script.crossOrigin}
            async
          />
        ))}
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider defaultTheme="dark">
          <MainLayout>
            {children}
          </MainLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
