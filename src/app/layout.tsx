import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
      <body className={inter.className}>
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
          {children}
        </div>
      </body>
    </html>
  );
} 