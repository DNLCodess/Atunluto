/**
 * app/results-portal/pu/submit/page.jsx
 * PU Admin — Result Submission (pre-filled, read-only location)
 * Delegates actual form UI to a client component.
 */

import { headers } from "next/headers";
import PUSubmitForm from "./submit-form";

export default async function PUSubmitPage() {
  const hdrs = await headers();
  const lga = hdrs.get("x-erms-lga") || "";
  const ward = hdrs.get("x-erms-ward") || "";
  const pu = hdrs.get("x-erms-polling-unit") || "";
  const adminId = hdrs.get("x-erms-id") || "";

  return (
    <PUSubmitForm lga={lga} ward={ward} pollingUnit={pu} adminId={adminId} />
  );
}
