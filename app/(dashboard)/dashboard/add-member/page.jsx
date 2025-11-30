// app/admin/add-member/page.jsx
"use client";

import { useRouter } from "next/navigation";
import useAuthStore from "@/lib/store";

import { ArrowLeft } from "lucide-react";
import MemberRegistrationForm from "@/components/common/reg-form";

export default function AddMemberPage() {
  const router = useRouter();
  const { role } = useAuthStore();

  // Optional: Role guard (extra safety)
  if (!["admin", "super_user"].includes(role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            You don&rsquo;t have permission to add members.
          </p>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    // Redirect back to members list after success
    setTimeout(() => {
      router.push("/admin/members");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-medium mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Members
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">Person</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Add New Member
              </h1>
              <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
                Register a new member into the Atunluto Group database. All
                information will be securely stored.
              </p>
            </div>

            {/* Your Reusable Form — 100% Untouched */}
            <MemberRegistrationForm
              onSuccess={handleSuccess}
              onError={(err) => console.error("Form error:", err)}
              showHeader={false}
              submitButtonText="Register Member"
              className="bg-gray-50 rounded-2xl p-8 border border-gray-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
