import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthSessionHandler } from "@/components/auth-session-handler";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "MSilva Proposals",
    template: "%s | MSilva Proposals",
  },
  description:
    "Propostas e orçamentos para catering e eventos — gestão de clientes, serviços e calendário.",
  icons: {
    icon: [{ url: "/favicon.png", sizes: "48x48", type: "image/png" }],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

const inter = Inter({
  variable: "--font-sans",
  display: "swap",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`${inter.variable} ${cormorant.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="msilva-proposals-theme"
          disableTransitionOnChange
        >
          <AuthSessionHandler />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
