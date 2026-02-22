// app/(user)/layout.js
import ServiceWorkerRegistration from "@/components/common/service-worker-registration";
import InstallPrompt from "@/components/common/installPrompt";
import Navbar from "@/components/common/navbar";
import Footer from "@/components/common/footer";

export default function UserLayout({ children }) {
  return (
    <>
      <ServiceWorkerRegistration />
      <InstallPrompt />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
