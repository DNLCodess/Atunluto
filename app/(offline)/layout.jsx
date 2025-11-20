import "../globals.css";
export const metadata = {
  title: "Offline - Atunluto Group",
  description: "You are currently offline",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflineLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
