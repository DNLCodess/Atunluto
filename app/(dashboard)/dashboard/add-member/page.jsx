// app/dashboard/add-member/page.jsx
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, UserPlus, Shield } from "lucide-react";
import MemberRegistrationForm from "@/components/common/reg-form";

export default function AddMemberPage() {
  const router = useRouter();
  const { role, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Role guard - Check permissions
  const hasPermission = [
    "admin",
    "super_user",
    "registration",
    "administrator",
  ].includes(role);

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-red-100">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-3">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-6">
              You don&rsquo;t have permission to add members. Please contact an
              administrator if you need access.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold text-gray-700 transition"
              >
                Go Back
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-semibold transition"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    // Redirect back to members list after success
    setTimeout(() => {
      router.push("/dashboard/members");
    }, 2000);
  };

  const handleError = (err) => {
    console.error("Form error:", err);
    // You could add toast notification here
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-medium mb-6 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Members
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-linear-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-100">
                <UserPlus className="w-10 h-10 text-green-700" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Add New Member
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Register a new member into the Atunluto Group database. All
                information will be securely stored and can be managed by
                authorized personnel.
              </p>

              {/* Role Badge */}
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">
                  Registering as {role?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Registration Form */}
            <MemberRegistrationForm
              onSuccess={handleSuccess}
              onError={handleError}
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
