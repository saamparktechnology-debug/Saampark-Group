import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlobalModals } from "@/components/modals/GlobalModals";
import { AuthGuard } from "@/components/auth/AuthGuard";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SAAMPARK - Enterprise Workspace",
  description: "Enterprise ERP, CRM, and Workspace",
  icons: {
    icon: "/saampark-logo.png",
    shortcut: "/saampark-logo.png",
    apple: "/saampark-logo.png",
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
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthGuard>
            <AppLayout>
              {children}
            </AppLayout>
            <GlobalModals />
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
