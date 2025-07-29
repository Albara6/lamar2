import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/lib/AuthProvider';

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crazy Chicken - Fast Food Restaurant",
  description: "Order delicious burgers, phillys, and chicken from Crazy Chicken",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#dc2626" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/business_logo.PNG" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
} 