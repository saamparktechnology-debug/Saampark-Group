import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlobalModals } from "@/components/modals/GlobalModals";
import { ActionFeedbackModal } from "@/components/ui/ActionFeedbackModal";
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
    icon: [
      { url: "/saampark-logo.png?v=2026", type: "image/png" },
      { url: "/logo.png?v=2026", type: "image/png" },
      { url: "/favicon.ico?v=2026" }
    ],
    shortcut: "/saampark-logo.png?v=2026",
    apple: "/saampark-logo.png?v=2026",
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
      <head>
        <link rel="icon" type="image/png" href="/saampark-logo.png?v=2026" />
        <link rel="shortcut icon" href="/saampark-logo.png?v=2026" />
        <link rel="apple-touch-icon" href="/saampark-logo.png?v=2026" />
      </head>
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
            <ActionFeedbackModal />
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
