"use client";

export default function OfflinePage() {
  const handleTryAgain = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-primary-green"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-montserrat font-extrabold text-text-dark mb-4">
          You&apos;re Offline
        </h1>

        <p className="text-lg font-poppins text-text-gray mb-8">
          It looks like you&apos;ve lost your internet connection. Some content
          may not be available until you&apos;re back online.
        </p>

        <div className="space-y-4">
          <button
            onClick={handleTryAgain}
            className="w-full bg-primary-green text-white font-poppins font-semibold py-3 px-6 rounded-lg hover:bg-secondary-green transition-colors duration-200"
          >
            Try Again
          </button>

          <button
            onClick={handleGoBack}
            className="w-full bg-white text-primary-green border-2 border-primary-green font-poppins font-semibold py-3 px-6 rounded-lg hover:bg-light-green transition-colors duration-200"
          >
            Go Back
          </button>
        </div>

        <div className="mt-12 p-4 bg-light-green rounded-lg">
          <p className="text-sm font-poppins text-text-dark">
            <strong className="font-montserrat">Tip:</strong> You can still
            browse cached pages while offline.
          </p>
        </div>
      </div>
    </div>
  );
}
