// app/layout.js
"use client";

import QueryProvider from "@/components/common/QueryProvider";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
