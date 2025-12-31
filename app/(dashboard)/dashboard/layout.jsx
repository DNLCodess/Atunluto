// app/admin/layout.jsx
import "../../globals.css";
import AdminLayoutWrapper from "@/components/shared/admin/layout-wrapper";

export const metadata = {
  title: "Admin - Atunluto Group",
  description: "Administrator Portal | Atunluto Group",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
