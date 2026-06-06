"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Upload,
  Loader2,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  ImageIcon,
} from "lucide-react";

// ─── Cloudinary upload helper ───────────────────────────────────────────────
async function uploadToCloudinary(file) {
  const signRes = await fetch("/api/cloudinary-sign?folder=site-content");
  if (!signRes.ok) throw new Error("Failed to get upload credentials.");
  const { signature, timestamp, folder, cloudName, apiKey } =
    await signRes.json();

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("signature", signature);
  fd.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) throw new Error("Image upload failed.");
  const data = await res.json();
  return data.secure_url;
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-poppins text-sm";

// ─── Image field ─────────────────────────────────────────────────────────────
function ImageField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
          {value ? (
            <Image
              src={value}
              alt="preview"
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-gray-300" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <label
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition ${
              uploading
                ? "bg-gray-100 text-gray-400"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading
              ? "Uploading…"
              : value
                ? "Replace image"
                : "Upload image"}
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-400">
            JPG, PNG or WEBP up to 10MB.
          </p>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── List field (array of primitives or objects) ─────────────────────────────
function ListField({ field, value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const isPrimitive =
    field.fields?.length === 1 && field.fields[0].name === "";

  const blankItem = () => {
    if (isPrimitive) return "";
    const obj = {};
    for (const f of field.fields) obj[f.name] = f.type === "number" ? 0 : "";
    return obj;
  };

  const update = (next) => onChange(next);
  const setItem = (i, v) =>
    update(items.map((it, idx) => (idx === i ? v : it)));
  const removeItem = (i) => update(items.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-gray-50/60 p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {field.itemLabel || "Item"} {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                title="Move up"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                title="Move down"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="p-1 text-red-400 hover:text-red-600"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isPrimitive ? (
            <Field
              field={{ ...field.fields[0], label: "" }}
              value={item}
              onChange={(v) => setItem(i, v)}
            />
          ) : (
            <div className="space-y-3">
              {field.fields.map((f) => (
                <Field
                  key={f.name}
                  field={f}
                  value={item?.[f.name]}
                  onChange={(v) => setItem(i, { ...item, [f.name]: v })}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => update([...items, blankItem()])}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-green-300 text-green-700 text-sm font-medium hover:bg-green-50 transition"
      >
        <Plus className="w-4 h-4" />
        Add {field.itemLabel || "item"}
      </button>
    </div>
  );
}

// ─── Recursive field dispatcher ──────────────────────────────────────────────
export default function Field({ field, value, onChange }) {
  const label = field.label ? (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-poppins">
      {field.label}
    </label>
  ) : null;

  switch (field.type) {
    case "textarea":
      return (
        <div>
          {label}
          <textarea
            rows={3}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClass} resize-y`}
          />
        </div>
      );

    case "number":
      return (
        <div>
          {label}
          <input
            type="number"
            value={value ?? ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            className={inputClass}
          />
        </div>
      );

    case "image":
      return (
        <div>
          {label}
          <ImageField value={value} onChange={onChange} />
        </div>
      );

    case "group":
      return (
        <div className="rounded-xl border border-gray-200 p-3 space-y-3">
          {field.label && (
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {field.label}
            </p>
          )}
          {field.fields.map((f) => (
            <Field
              key={f.name}
              field={f}
              value={value?.[f.name]}
              onChange={(v) => onChange({ ...(value || {}), [f.name]: v })}
            />
          ))}
        </div>
      );

    case "list":
      return (
        <div>
          {label}
          <ListField field={field} value={value} onChange={onChange} />
        </div>
      );

    case "text":
    default:
      return (
        <div>
          {label}
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        </div>
      );
  }
}
