"use client";

import { useRef, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const CONFIG = {
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

export default function MembershipCardDownload({ member }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.textBaseline = "top";
      const w = img.width;
      const h = img.height;

      function drawText(text, cfg) {
        const x = (cfg.x / 100) * w;
        const y = (cfg.y / 100) * h;
        const maxWidth = (cfg.maxWidth / 100) * w;
        const fontSize = (cfg.fontSize / 100) * h;
        const lineHeight = fontSize * 1.2;
        ctx.fillStyle = cfg.color;
        ctx.font = `${cfg.fontWeight} ${fontSize}px Raleway, Arial, sans-serif`;
        ctx.textAlign = cfg.align;
        const words = text.split(" ");
        let line = "";
        let lines = [];
        for (let i = 0; i < words.length; i++) {
          const test = line + words[i] + " ";
          if (ctx.measureText(test).width > maxWidth && i > 0) {
            lines.push(line.trim());
            line = words[i] + " ";
            if (lines.length >= cfg.maxLines) break;
          } else {
            line = test;
          }
        }
        if (lines.length < cfg.maxLines && line.trim()) lines.push(line.trim());
        lines.forEach((t, i) => ctx.fillText(t, x, y + i * lineHeight));
      }

      drawText(member.full_name.toUpperCase(), CONFIG.name);
      drawText(
        (member.gender || "").replace("_", " ").toUpperCase(),
        CONFIG.gender,
      );
      drawText(member.lga.toUpperCase(), CONFIG.lga);
      drawText(member.ward, CONFIG.ward);
      drawText(member.polling_unit, CONFIG.pollingUnit);
      drawText(member.membership_number, CONFIG.cardNumber);
      setReady(true);
    };
    img.src = "/card.png";
  }, [member]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${member.full_name.replace(/\s+/g, "_")}_membership_card.png`;
        a.click();
        URL.revokeObjectURL(url);
      },
      "image/png",
      1.0,
    );
  }

  function handlePrint() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.title = `Membership Card — ${member.full_name}`;
    const style = win.document.createElement("style");
    style.textContent =
      "*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;min-height:100vh}img{max-width:100%;height:auto}@media print{body{min-height:unset}}";
    win.document.head.appendChild(style);
    const img = win.document.createElement("img");
    img.src = dataUrl;
    img.onload = () => {
      win.print();
      win.close();
    };
    win.document.body.appendChild(img);
  }

  return (
    <div className="mt-4 space-y-3">
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl border border-border-gray shadow-sm"
        style={{ display: ready ? "block" : "none" }}
      />
      {!ready && (
        <div className="h-40 rounded-xl border border-border-gray bg-off-white flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-accent-green animate-spin" />
        </div>
      )}
      {ready && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-green hover:bg-secondary-green text-white font-secondary font-semibold text-sm transition-colors shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Card
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-primary-green text-primary-green hover:bg-primary-green hover:text-white font-secondary font-semibold text-sm transition-colors shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Card
          </button>
        </div>
      )}
    </div>
  );
}
