import Sidebar from "./sidebar";

export default function MobileMenu({ setSidebarOpen }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => setSidebarOpen(false)}
      ></div>
      <div className="relative flex flex-col w-80 max-w-xs bg-gradient-to-b from-green-800 to-green-900">
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
