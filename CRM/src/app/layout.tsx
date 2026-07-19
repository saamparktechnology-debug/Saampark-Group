import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Sampark Dashboard",
  description: "Project Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        {/* The AuthProvider must wrap EVERYTHING that needs 
          to access user data or the logout function.
        */}
        <AuthProvider>
          <Topbar />
          <Sidebar />
          <main
            style={{
              marginLeft: "var(--sidebar-width)",
              marginTop: "var(--topbar-height)",
              minHeight: "calc(100vh - var(--topbar-height))",
              padding: "18px",
            }}
          >
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}