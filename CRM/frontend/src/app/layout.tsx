import type { Metadata } from "next";
import "./globals.css";

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlobalModals } from "@/components/modals/GlobalModals";
import { ActionFeedbackModal } from "@/components/ui/ActionFeedbackModal";
import { AuthGuard } from "@/components/auth/AuthGuard";

const inter = {
  variable: "font-sans",
};

export const metadata: Metadata = {
  title: "SAAMPARK - Enterprise Workspace",
  description: "Enterprise ERP, CRM, and Workspace",
  icons: {
    icon: [
      { url: "/saampark-logo.png?v=root_logo_v3", type: "image/png" },
      { url: "/logo.png?v=root_logo_v3", type: "image/png" },
      { url: "/favicon.ico?v=root_logo_v3" }
    ],
    shortcut: "/saampark-logo.png?v=root_logo_v3",
    apple: "/saampark-logo.png?v=root_logo_v3",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" />
        <link rel="icon" type="image/png" href="/saampark-logo.png?v=root_logo_v3" />
        <link rel="shortcut icon" href="/saampark-logo.png?v=root_logo_v3" />
        <link rel="apple-touch-icon" href="/saampark-logo.png?v=root_logo_v3" />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <QueryProvider>
            <AuthGuard>
              <AppLayout>
                {children}
              </AppLayout>
              <GlobalModals />
              <ActionFeedbackModal />
            </AuthGuard>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
