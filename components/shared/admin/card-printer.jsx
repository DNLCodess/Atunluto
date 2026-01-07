import { useRef, useState } from "react";
import { X, Printer, Copy, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MembershipCardPrinter({ member, onClose }) {
  const cardRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  // Text positioning configuration - easily customizable
  const [positions, setPositions] = useState({
    name: {
      top: "32.5%",
      left: "13.5%",
      right: "56%",
      fontSize: "3.8mm",
      fontWeight: "700",
      color: "#1f2937",
      textTransform: "uppercase",
      letterSpacing: "0.3px",
    },
    gender: {
      top: "44.5%",
      left: "20.5%",
      right: "56%",
      fontSize: "3.5mm",
      fontWeight: "600",
      color: "#374151",
      textTransform: "uppercase",
      letterSpacing: "0.2px",
    },
    lga: {
      top: "56.5%",
      left: "16%",
      right: "56%",
      fontSize: "3.5mm",
      fontWeight: "600",
      color: "#374151",
      textTransform: "uppercase",
      letterSpacing: "0.2px",
    },
    ward: {
      top: "68.5%",
      left: "15.5%",
      right: "56%",
      fontSize: "3.5mm",
      fontWeight: "600",
      color: "#374151",
      letterSpacing: "0.2px",
    },
    pollingUnit: {
      top: "80.5%",
      left: "26.5%",
      right: "56%",
      fontSize: "3.2mm",
      fontWeight: "600",
      color: "#374151",
      letterSpacing: "0.2px",
    },
    cardNumber: {
      top: "70%",
      left: "62%",
      right: "8%",
      fontSize: "4.5mm",
      fontWeight: "800",
      color: "#065f46",
      letterSpacing: "0.5px",
      textAlign: "center",
    },
  });

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const cardHTML = cardRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Membership Card - ${member.full_name}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Raleway', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
            }
            .card-wrapper {
              width: 85.6mm;
              height: 54mm;
              position: relative;
            }
            @media print {
              body {
                background: white;
              }
              .card-wrapper {
                page-break-inside: avoid;
              }
              @page {
                size: 85.6mm 54mm;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          ${cardHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    }, 500);
  };

  const copyPositions = () => {
    const positionsText = JSON.stringify(positions, null, 2);
    navigator.clipboard.writeText(positionsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updatePosition = (field, property, value) => {
    setPositions((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [property]: value,
      },
    }));
  };

  const formatGender = (gender) => {
    if (!gender) return "N/A";
    return gender.replace("_", " ").toUpperCase();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-8"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Membership Card
              </h2>
              <p className="text-sm text-gray-600 mt-1">{member.full_name}</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center gap-2 px-4 py-2 ${
                  showSettings
                    ? "bg-gray-200 text-gray-900"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                } font-medium rounded-xl transition`}
              >
                <Settings className="w-5 h-5" />
                {showSettings ? "Hide" : "Adjust"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg shadow-green-600/30 transition"
              >
                <Printer className="w-5 h-5" />
                Print Card
              </motion.button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="flex gap-8">
              {/* Card Preview */}
              <div className="flex-1 flex flex-col items-center">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Card Preview
                  </h3>
                  <p className="text-sm text-gray-600">
                    Actual size: 85.6mm × 54mm (Credit card size)
                  </p>
                </div>

                <div
                  ref={cardRef}
                  className="card-wrapper border-2 border-gray-300 rounded-lg overflow-hidden"
                  style={{
                    width: "85.6mm",
                    height: "54mm",
                    position: "relative",
                  }}
                >
                  <img
                    src="/card.png"
                    alt="Membership Card Background"
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      objectFit: "cover",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      fontFamily: "'Raleway', sans-serif",
                    }}
                  >
                    {/* Name */}
                    <div
                      style={{
                        position: "absolute",
                        ...positions.name,
                        lineHeight: "1.2",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {member.full_name}
                    </div>

                    {/* Gender */}
                    <div
                      style={{
                        position: "absolute",
                        ...positions.gender,
                      }}
                    >
                      {formatGender(member.gender)}
                    </div>

                    {/* L.G.A */}
                    <div
                      style={{
                        position: "absolute",
                        ...positions.lga,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {member.lga}
                    </div>

                    {/* Ward */}
                    <div
                      style={{
                        position: "absolute",
                        ...positions.ward,
                      }}
                    >
                      {member.ward}
                    </div>

                    {/* Polling Unit */}
                    <div
                      style={{
                        position: "absolute",
                        ...positions.pollingUnit,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {member.polling_unit}
                    </div>

                    {/* Card Number */}
                    <div
                      style={{
                        position: "absolute",
                        ...positions.cardNumber,
                        fontFamily: "'Raleway', monospace",
                      }}
                    >
                      {member.membership_number}
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl max-w-md">
                  <p className="text-sm text-blue-900 font-medium flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Use high-quality card stock paper for best results
                  </p>
                </div>
              </div>

              {/* Position Settings */}
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-96 bg-gray-50 rounded-xl p-6 overflow-y-auto max-h-[600px]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Position Settings
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copyPositions}
                      className={`flex items-center gap-2 px-3 py-2 ${
                        copied
                          ? "bg-green-600 text-white"
                          : "bg-white hover:bg-gray-100 text-gray-700"
                      } rounded-lg text-sm font-medium transition border border-gray-300`}
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? "Copied!" : "Copy JSON"}
                    </motion.button>
                  </div>

                  <div className="space-y-6">
                    {Object.entries(positions).map(([field, props]) => (
                      <div
                        key={field}
                        className="bg-white rounded-lg p-4 border border-gray-200"
                      >
                        <h4 className="font-semibold text-gray-900 mb-3 capitalize">
                          {field.replace(/([A-Z])/g, " $1").trim()}
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(props).map(([prop, value]) => (
                            <div key={prop} className="flex flex-col">
                              <label className="text-xs font-medium text-gray-600 mb-1">
                                {prop}
                              </label>
                              <input
                                type="text"
                                value={value}
                                onChange={(e) =>
                                  updatePosition(field, prop, e.target.value)
                                }
                                className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
