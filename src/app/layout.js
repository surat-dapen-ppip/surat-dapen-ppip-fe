import localFont from "next/font/local";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import "./globals.css";
import Script from "next/script";
import { LayoutProvider } from "@/hooks/useLayoutContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Surat PPIP",
  description: "Surat PPIP",
  icons: {
    icon: "/logo-ppip.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/flowbite@2.5.2/dist/flowbite.min.css" rel="stylesheet" />
        <Script src="https://cdn.jsdelivr.net/npm/flowbite@2.5.2/dist/flowbite.min.js"></Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AntdRegistry>
          <LayoutProvider>
            {children}
          </LayoutProvider>

        </AntdRegistry>
      </body>
    </html>
  );
}
