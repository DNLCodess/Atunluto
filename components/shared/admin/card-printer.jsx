import { useRef, useState, useEffect } from "react";
import {
  X,
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings,
  Copy,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MembershipCardPrinter({ member, onClose }) {
  const canvasRef = useRef(null);
  const [cardImage, setCardImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fixed display dimensions
  const DISPLAY_WIDTH = 600;
  const DISPLAY_HEIGHT = 846;

  // DEFAULT CONFIGURATION - Optimized and finalized
  const DEFAULT_CONFIG = {
    name: {
      x: 21,
      y: 34.2,
      maxWidth: 66.2,
      fontSize: 3,
      fontWeight: "700",
      color: "#1f2937",
      align: "left",
      maxLines: 1,
    },
    gender: {
      x: 23.5,
      y: 41.5,
      maxWidth: 55.6,
      fontSize: 3,
      fontWeight: "600",
      color: "#374151",
      align: "left",
      maxLines: 1,
    },
    lga: {
      x: 18.7,
      y: 48.9,
      maxWidth: 28,
      fontSize: 3,
      fontWeight: "600",
      color: "#374151",
      align: "left",
      maxLines: 1,
    },
    ward: {
      x: 18.9,
      y: 56,
      maxWidth: 28.5,
      fontSize: 3,
      fontWeight: "600",
      color: "#374151",
      align: "left",
      maxLines: 1,
    },
    pollingUnit: {
      x: 32.9,
      y: 63.3,
      maxWidth: 17.5,
      fontSize: 3.5,
      fontWeight: "600",
      color: "#374151",
      align: "left",
      maxLines: 1,
    },
    cardNumber: {
      x: 63.4,
      y: 77.3,
      maxWidth: 22,
      fontSize: 4,
      fontWeight: "800",
      color: "#065f46",
      align: "center",
      maxLines: 1,
    },
  };

  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // Load card background image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setCardImage(img);
      setImageLoaded(true);
      drawCard(img);
    };
    img.onerror = () => {
      console.error("Failed to load card image");
    };
    img.src = "/card.png";
  }, []);

  // Redraw when config or member changes
  useEffect(() => {
    if (imageLoaded && cardImage) {
      drawCard(cardImage);
    }
  }, [imageLoaded, cardImage, member, config]);

  const drawCard = (img) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.textBaseline = "top";

    const w = img.width;
    const h = img.height;

    // Helper to draw text with wrapping
    const drawText = (text, fieldConfig) => {
      const x = (fieldConfig.x / 100) * w;
      const y = (fieldConfig.y / 100) * h;
      const maxWidth = (fieldConfig.maxWidth / 100) * w;
      const fontSize = (fieldConfig.fontSize / 100) * h;

      ctx.fillStyle = fieldConfig.color;
      ctx.font = `${fieldConfig.fontWeight} ${fontSize}px Raleway, Arial, sans-serif`;
      ctx.textAlign = fieldConfig.align;

      const words = text.split(" ");
      let line = "";
      let lineCount = 0;
      const lineHeight = fontSize * 1.2;
      let lines = [];

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && i > 0) {
          lines.push(line.trim());
          line = words[i] + " ";
          lineCount++;

          if (lineCount >= fieldConfig.maxLines) {
            break;
          }
        } else {
          line = testLine;
        }
      }

      if (lineCount < fieldConfig.maxLines && line.trim()) {
        lines.push(line.trim());
      }

      lines.forEach((textLine, index) => {
        if (
          index === fieldConfig.maxLines - 1 &&
          lines.length > fieldConfig.maxLines
        ) {
          ctx.fillText(textLine + "...", x, y + index * lineHeight);
        } else {
          ctx.fillText(textLine, x, y + index * lineHeight);
        }
      });
    };

    // Draw all fields
    drawText(member.full_name.toUpperCase(), config.name);

    const genderText = member.gender
      ? member.gender.replace("_", " ").toUpperCase()
      : "N/A";
    drawText(genderText, config.gender);

    drawText(member.lga.toUpperCase(), config.lga);
    drawText(member.ward, config.ward);
    drawText(member.polling_unit, config.pollingUnit);
    drawText(member.membership_number, config.cardNumber);
  };

  const updateField = (field, property, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [property]: parseFloat(value) || value,
      },
    }));
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const copyConfiguration = () => {
    const configCode = `// Copy this configuration and send it back to update defaults
const DEFAULT_CONFIG = ${JSON.stringify(config, null, 2)};`;

    navigator.clipboard.writeText(configCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open("", "_blank");
    const dataUrl = canvas.toDataURL("image/png", 1.0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Membership Card - ${member.full_name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: white;
              padding: 20px;
            }
            img {
              max-width: 100%;
              height: auto;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            @media print {
              body { padding: 0; }
              @page { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="Membership Card" />
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${member.full_name.replace(
          /\s+/g,
          "_"
        )}_membership_card.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      },
      "image/png",
      1.0
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="text-white">
              <h2 className="text-xl font-bold">Membership Card Preview</h2>
              <p className="text-green-100 text-sm mt-0.5">
                {member.full_name}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                disabled={zoom <= 0.5}
                className="p-2 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-gray-300 transition"
              >
                <ZoomOut className="w-4 h-4 text-gray-700" />
              </button>

              <div className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-semibold text-sm text-gray-900 min-w-[70px] text-center">
                {Math.round(zoom * 100)}%
              </div>

              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                disabled={zoom >= 2}
                className="p-2 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-gray-300 transition"
              >
                <ZoomIn className="w-4 h-4 text-gray-700" />
              </button>

              <button
                onClick={() => setZoom(1)}
                className="p-2 bg-white hover:bg-gray-100 rounded-lg border border-gray-300 transition"
              >
                <Maximize2 className="w-4 h-4 text-gray-700" />
              </button>

              <div className="w-px h-8 bg-gray-300 mx-2"></div>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center gap-2 px-3 py-2 ${
                  showSettings
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700"
                } hover:bg-green-600 hover:text-white rounded-lg border border-gray-300 transition font-medium text-sm`}
              >
                <Settings className="w-4 h-4" />
                {showSettings ? "Hide" : "Adjust"} Settings
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border-2 border-green-600 text-green-700 font-semibold rounded-xl transition text-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg shadow-green-600/30 transition text-sm"
              >
                <Printer className="w-4 h-4" />
                Print
              </motion.button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Settings Panel */}
            {showSettings && (
              <motion.div
                initial={{ x: -400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -400, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-96 bg-white border-r border-gray-200 flex flex-col"
              >
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Manual Adjustments
                  </h3>
                  <p className="text-sm text-gray-600">
                    All values are percentages of card dimensions
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {Object.entries(config).map(([field, fieldConfig]) => (
                    <div
                      key={field}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <h4 className="font-bold text-gray-900 mb-3 capitalize text-sm">
                        {field === "lga"
                          ? "LGA"
                          : field === "pollingUnit"
                          ? "Polling Unit"
                          : field === "cardNumber"
                          ? "Card Number"
                          : field}
                      </h4>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">
                              X Position (%)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={fieldConfig.x}
                              onChange={(e) =>
                                updateField(field, "x", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">
                              Y Position (%)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={fieldConfig.y}
                              onChange={(e) =>
                                updateField(field, "y", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">
                              Max Width (%)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={fieldConfig.maxWidth}
                              onChange={(e) =>
                                updateField(field, "maxWidth", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">
                              Font Size (%)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={fieldConfig.fontSize}
                              onChange={(e) =>
                                updateField(field, "fontSize", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">
                              Font Weight
                            </label>
                            <select
                              value={fieldConfig.fontWeight}
                              onChange={(e) =>
                                updateField(field, "fontWeight", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                            >
                              <option value="400">400 (Normal)</option>
                              <option value="500">500 (Medium)</option>
                              <option value="600">600 (SemiBold)</option>
                              <option value="700">700 (Bold)</option>
                              <option value="800">800 (ExtraBold)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">
                              Text Align
                            </label>
                            <select
                              value={fieldConfig.align}
                              onChange={(e) =>
                                updateField(field, "align", e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-gray-600 block mb-1">
                            Color
                          </label>
                          <input
                            type="text"
                            value={fieldConfig.color}
                            onChange={(e) =>
                              updateField(field, "color", e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-600 block mb-1">
                            Max Lines
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={fieldConfig.maxLines}
                            onChange={(e) =>
                              updateField(field, "maxLines", e.target.value)
                            }
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 border-t border-gray-200 space-y-2 flex-shrink-0">
                  <button
                    onClick={copyConfiguration}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${
                      copied ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"
                    } text-white font-semibold rounded-lg transition`}
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? "Configuration Copied!" : "Copy Config to Share"}
                  </button>

                  <button
                    onClick={resetToDefaults}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset to Defaults
                  </button>
                </div>
              </motion.div>
            )}

            {/* Card Preview */}
            <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-100 to-gray-50">
              {!imageLoaded ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-600 font-medium">Loading card...</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-full p-8">
                  <div
                    className="bg-white rounded-lg shadow-2xl"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "center",
                      transition: "transform 0.3s ease",
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="block rounded-lg"
                      style={{
                        width: `${DISPLAY_WIDTH}px`,
                        height: `${DISPLAY_HEIGHT}px`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Footer */}
          <div className="bg-blue-50 border-t border-blue-200 px-6 py-3 flex-shrink-0">
            <div className="flex items-center justify-between gap-4 text-sm text-blue-900 flex-wrap">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <p>
                  <span className="font-semibold">Tip:</span> Adjust settings to
                  perfect the layout, then copy the config to make it the
                  default for all future cards.
                </p>
              </div>
              {cardImage && (
                <div className="text-xs font-mono bg-blue-100 px-3 py-1.5 rounded border border-blue-300">
                  Original: {cardImage.width} × {cardImage.height}px
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
