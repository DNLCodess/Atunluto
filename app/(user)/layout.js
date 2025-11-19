import { Montserrat, Poppins } from "next/font/google";
import "../globals.css";

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
    "Atunluto, Oyo South, Nigeria politics, grassroots movement, community development, political reform, Ibarapa, cooperative politics, Nigerian democracy",
  authors: [{ name: "Atunluto Group" }],
  creator: "Atunluto Group",
  publisher: "Atunluto Group",
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
        url: "/og-image.jpg", // You'll need to create this
        width: 1200,
        height: 630,
        alt: "Atunluto Group - Building Nigeria Together",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Atunluto Group - Building Nigeria Together",
    description:
      "Join the movement for political and economic transformation in Oyo South Senatorial District.",
    images: ["/twitter-image.jpg"], // You'll need to create this
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
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Additional meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1B5E20" />
      </head>
      <body
        className={`${montserrat.variable} ${poppins.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
