import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const sarabun = Sarabun({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "CarFlow — ระบบจองรถ โรงเรียนดอนตาลวิทยา",
  description:
    "ระบบจองรถโรงเรียนดอนตาลวิทยา สพม.มุกดาหาร — จองรถออนไลน์ ปฏิทินการใช้งาน",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={`${sarabun.className} min-h-screen`}>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
