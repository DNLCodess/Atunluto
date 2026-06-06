"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, Save, RotateCcw, Check, ExternalLink } from "lucide-react";
import Field from "./field";

export default function SectionEditor({
  schema,
  initialContent,
  isCustomised,
  onSave,
  onReset,
  saving,
  resetting,
  saveError,
  canEdit,
}) {
  const [content, setContent] = useState(initialContent);
  const [savedFlash, setSavedFlash] = useState(false);

  // Re-sync when switching to a different section.
  useEffect(() => {
    setContent(initialContent);
    setSavedFlash(false);
  }, [schema.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(
    () => JSON.stringify(content) !== JSON.stringify(initialContent),
    [content, initialContent],
  );

  const setField = (name, value) =>
    setContent((c) => ({ ...c, [name]: value }));

  const handleSave = async () => {
    await onSave(content);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Reset this section back to the original built-in content? Your saved changes for it will be removed.",
      )
    )
      return;
    await onReset();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 p-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-gray-900 font-montserrat">
              {schema.label}
            </h2>
            {isCustomised && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                Customised
              </span>
            )}
          </div>
          {schema.description && (
            <p className="text-sm text-gray-500 mt-1 font-poppins max-w-2xl">
              {schema.description}
            </p>
          )}
        </div>
        {schema.preview && (
          <a
            href={schema.preview}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:underline font-medium"
          >
            View live <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Fields */}
      <div className="p-6 space-y-5 max-h-[calc(100vh-22rem)] overflow-y-auto">
        {schema.fields.map((f) => (
          <Field
            key={f.name}
            field={f}
            value={content?.[f.name]}
            onChange={(v) => setField(f.name, v)}
          />
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-6 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">
        <div className="text-sm">
          {saveError ? (
            <span className="text-red-600">{saveError}</span>
          ) : savedFlash ? (
            <span className="inline-flex items-center gap-1.5 text-green-700 font-medium">
              <Check className="w-4 h-4" /> Saved — live on the website
            </span>
          ) : dirty ? (
            <span className="text-amber-600">Unsaved changes</span>
          ) : (
            <span className="text-gray-400">All changes saved</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isCustomised && (
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting || !canEdit}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-50"
            >
              {resetting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Reset to default
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving || !canEdit}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#1B5E20" }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
