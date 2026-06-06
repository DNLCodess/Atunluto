"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSiteContentAdmin } from "@/hooks/use-site-content";
import { CMS_SCHEMA, CMS_GROUPS } from "@/lib/cms-schema";
import SectionEditor from "@/components/shared/admin/content/section-editor";
import { Loader2, FileText, Lock } from "lucide-react";

const CAN_MANAGE = ["state_admin", "super_user", "manager"];

// Where each page group can be previewed on the live site.
const GROUP_PREVIEW = {
  "Site-wide": "/",
  "Home Page": "/",
  "About Page": "/about",
  "Mission & Vision Page": "/mission-vision",
  "Manifestoes Page": "/manifestoes",
};

export default function ContentPage() {
  const { role, isLoading: authLoading } = useAuth();
  const {
    getSection,
    isCustomised,
    isLoading,
    fetchError,
    saveSection,
    isSaving,
    saveError,
    resetSection,
    isResetting,
  } = useSiteContentAdmin();

  const [activeGroup, setActiveGroup] = useState(CMS_GROUPS[0]);
  const [activeKey, setActiveKey] = useState(CMS_SCHEMA[0].key);

  const canEdit = CAN_MANAGE.includes(role);

  const sectionsInGroup = useMemo(
    () => CMS_SCHEMA.filter((s) => s.group === activeGroup),
    [activeGroup],
  );

  const activeSchema = useMemo(
    () => CMS_SCHEMA.find((s) => s.key === activeKey) ?? CMS_SCHEMA[0],
    [activeKey],
  );

  const handleGroupChange = (group) => {
    setActiveGroup(group);
    const first = CMS_SCHEMA.find((s) => s.group === group);
    if (first) setActiveKey(first.key);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto mt-12">
        <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 font-montserrat">
          No access
        </h2>
        <p className="text-gray-500 mt-2 font-poppins text-sm">
          You don&apos;t have permission to edit website content. Ask a State
          Admin for the Content Manager role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
          <FileText className="w-5 h-5 text-green-700" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 font-montserrat">
            Site Content
          </h1>
          <p className="text-gray-500 font-poppins text-sm">
            Edit the public website. Changes go live as soon as you save.
          </p>
        </div>
      </div>

      {fetchError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          Failed to load content: {fetchError}
        </div>
      )}

      {/* Page group tabs */}
      <div className="flex flex-wrap gap-2">
        {CMS_GROUPS.map((group) => (
          <button
            key={group}
            onClick={() => handleGroupChange(group)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeGroup === group
                ? "bg-green-700 text-white shadow"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Section list */}
        <div className="space-y-1.5">
          {sectionsInGroup.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveKey(s.key)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center justify-between gap-2 ${
                activeKey === s.key
                  ? "bg-white border border-green-200 shadow-sm text-green-800"
                  : "text-gray-600 hover:bg-white hover:border-gray-200 border border-transparent"
              }`}
            >
              <span>{s.label}</span>
              {isCustomised(s.key) && (
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Editor */}
        <SectionEditor
          key={activeSchema.key}
          schema={{
            ...activeSchema,
            preview: GROUP_PREVIEW[activeSchema.group],
          }}
          initialContent={getSection(activeSchema.key)}
          isCustomised={isCustomised(activeSchema.key)}
          canEdit={canEdit}
          saving={isSaving}
          resetting={isResetting}
          saveError={saveError}
          onSave={(content) =>
            saveSection({ key: activeSchema.key, content })
          }
          onReset={() => resetSection(activeSchema.key)}
        />
      </div>
    </div>
  );
}
