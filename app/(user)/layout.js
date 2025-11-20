import { Montserrat, Poppins } from "next/font/google";
import "../globals.css";
import ServiceWorkerRegistration from "@/components/common/service-worker-registration";
import InstallPrompt from "@/components/common/installPrompt";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"], // Regular to ExtraBold
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"], // Regular to ExtraBold
  display: "swap",
});

export const metadata = {
  title: "Atunluto Group - Building Nigeria Together",
  description:
    "Atunluto Group is a political association dedicated to transforming Oyo South Senatorial District through cooperative politics, community development, and grassroots empowerment. Join us in our mission to bring lasting change to Nigeria.",
  keywords:
    "Atunluto, Oyo South, Nigeria politics, grassroots movement, community development, political reform, Ibarapa, cooperative politics, Nigerian democracy, Oyo State",
  authors: [{ name: "Atunluto Group" }],
  creator: "Atunluto Group",
  publisher: "Atunluto Group",
  applicationName: "Atunluto Group",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Atunluto Group",
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  openGraph: {
    title: "Atunluto Group - Building Nigeria Together",
    description:
      "Join the movement for political and economic transformation in Oyo South Senatorial District. Cooperative politics for the people, by the people.",
    url: "https://www.atunlutogroup.org", // Replace with actual domain
    siteName: "Atunluto Group",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Atunluto Group - Building Nigeria Together",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-NG">
      <head>
        <meta name="theme-color" content="#1B5E20" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Atunluto" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
      </head>
      <body
        className={`${montserrat.variable} ${poppins.variable} antialiased`}
      >
        <ServiceWorkerRegistration />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
