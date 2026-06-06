// lib/cms-schema.js
// ─────────────────────────────────────────────────────────────────────────────
// Describes how each site_content section is presented in the dashboard editor.
// The generic <SectionEditor> renders forms purely from this schema, so adding
// or changing an editable field means editing this file (+ cms-defaults.js) only.
//
// Field types:
//   text     — single-line input
//   textarea — multi-line input
//   number   — numeric input
//   image    — Cloudinary image upload (stores a URL string)
//   group    — nested object, has `fields`
//   list     — array of items, each item described by `fields`
// ─────────────────────────────────────────────────────────────────────────────

const linkFields = [
  { name: "label", label: "Button text", type: "text" },
  { name: "href", label: "Link (e.g. /join-us)", type: "text" },
];

export const CMS_SCHEMA = [
  // ─── Site-wide ──────────────────────────────────────────────────────────────
  {
    key: "site.settings",
    group: "Site-wide",
    label: "Brand, Contact & Social",
    description:
      "Logo, brand name, navigation menu, footer text, contact details and social links — used across the whole site.",
    fields: [
      { name: "logo", label: "Logo", type: "image" },
      { name: "brandName", label: "Brand name (navbar)", type: "text" },
      { name: "joinCtaLabel", label: "“Join” button text", type: "text" },
      {
        name: "navLinks",
        label: "Navigation menu",
        type: "list",
        itemLabel: "Link",
        fields: [
          { name: "name", label: "Label", type: "text" },
          { name: "href", label: "Link", type: "text" },
        ],
      },
      { name: "footerBrand", label: "Footer brand name", type: "text" },
      { name: "footerBlurb", label: "Footer description", type: "textarea" },
      {
        name: "contact",
        label: "Contact details",
        type: "group",
        fields: [
          { name: "email", label: "Email", type: "text" },
          { name: "whatsapp", label: "WhatsApp", type: "text" },
          { name: "tel", label: "Phone", type: "text" },
          { name: "address", label: "Address", type: "textarea" },
        ],
      },
      {
        name: "social",
        label: "Social links",
        type: "list",
        itemLabel: "Social account",
        fields: [
          { name: "platform", label: "Platform", type: "text" },
          { name: "href", label: "Profile URL", type: "text" },
        ],
      },
    ],
  },

  // ─── Home page ────────────────────────────────────────────────────────────
  {
    key: "home.hero",
    group: "Home Page",
    label: "Hero Slider",
    description: "The full-screen rotating banner at the top of the home page.",
    fields: [
      {
        name: "slides",
        label: "Slides",
        type: "list",
        itemLabel: "Slide",
        fields: [
          { name: "image", label: "Background image", type: "image" },
          { name: "title", label: "Title", type: "text" },
          { name: "subtitle", label: "Subtitle", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
        ],
      },
      { name: "ctaPrimary", label: "Primary button", type: "group", fields: linkFields },
      { name: "ctaSecondary", label: "Secondary button", type: "group", fields: linkFields },
    ],
  },
  {
    key: "home.about",
    group: "Home Page",
    label: "About blurb",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      {
        name: "paragraphs",
        label: "Paragraphs",
        type: "list",
        itemLabel: "Paragraph",
        fields: [{ name: "", label: "Text", type: "textarea" }],
      },
      { name: "quote", label: "Pull quote", type: "textarea" },
    ],
  },
  {
    key: "home.missionVision",
    group: "Home Page",
    label: "Mission & Vision teaser",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      {
        name: "mission",
        label: "Mission",
        type: "group",
        fields: [
          { name: "text", label: "Mission text", type: "textarea" },
          {
            name: "points",
            label: "Key points",
            type: "list",
            itemLabel: "Point",
            fields: [{ name: "", label: "Point", type: "text" }],
          },
        ],
      },
      {
        name: "vision",
        label: "Vision",
        type: "group",
        fields: [
          { name: "text", label: "Vision text", type: "textarea" },
          {
            name: "points",
            label: "Key points",
            type: "list",
            itemLabel: "Point",
            fields: [{ name: "", label: "Point", type: "text" }],
          },
        ],
      },
      {
        name: "quote",
        label: "Quote card",
        type: "group",
        fields: [
          { name: "text", label: "Quote", type: "textarea" },
          { name: "attribution", label: "Attribution", type: "text" },
        ],
      },
    ],
  },
  {
    key: "home.pillars",
    group: "Home Page",
    label: "Six Pillars table",
    fields: [
      { name: "eyebrow", label: "Eyebrow (small label)", type: "text" },
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Intro text", type: "textarea" },
      {
        name: "items",
        label: "Pillars",
        type: "list",
        itemLabel: "Pillar",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "focus", label: "Key focus", type: "textarea" },
          { name: "target", label: "Target", type: "text" },
        ],
      },
      {
        name: "stats",
        label: "Stats bar",
        type: "list",
        itemLabel: "Stat",
        fields: [
          { name: "value", label: "Value", type: "text" },
          { name: "label", label: "Label", type: "text" },
        ],
      },
    ],
  },
  {
    key: "home.stats",
    group: "Home Page",
    label: "Impact in Numbers",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      {
        name: "items",
        label: "Counters",
        type: "list",
        itemLabel: "Counter",
        fields: [
          { name: "value", label: "Number", type: "number" },
          { name: "suffix", label: "Suffix (e.g. +)", type: "text" },
          { name: "label", label: "Label", type: "text" },
          { name: "description", label: "Description", type: "text" },
        ],
      },
      { name: "bottomText", label: "Bottom text", type: "text" },
      { name: "ctaLabel", label: "Button text", type: "text" },
    ],
  },
  {
    key: "home.cta",
    group: "Home Page",
    label: "Bottom call-to-action",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Intro text", type: "textarea" },
      {
        name: "benefits",
        label: "Benefits list",
        type: "list",
        itemLabel: "Benefit",
        fields: [{ name: "", label: "Benefit", type: "text" }],
      },
      { name: "memberCount", label: "Member count badge", type: "text" },
      { name: "memberCountSub", label: "Member count subtitle", type: "text" },
      { name: "cardHeading", label: "Card heading", type: "text" },
      { name: "cardIntro", label: "Card intro", type: "textarea" },
      { name: "checklistHeading", label: "Checklist heading", type: "text" },
      {
        name: "checklist",
        label: "Checklist items",
        type: "list",
        itemLabel: "Item",
        fields: [{ name: "", label: "Item", type: "text" }],
      },
    ],
  },

  // ─── About page ─────────────────────────────────────────────────────────────
  {
    key: "about.hero",
    group: "About Page",
    label: "Hero",
    fields: [
      { name: "badge", label: "Badge", type: "text" },
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Intro text", type: "textarea" },
      {
        name: "slides",
        label: "Image slider",
        type: "list",
        itemLabel: "Image",
        fields: [
          { name: "image", label: "Image", type: "image" },
          { name: "alt", label: "Alt text", type: "text" },
        ],
      },
      {
        name: "stats",
        label: "Stats",
        type: "list",
        itemLabel: "Stat",
        fields: [
          { name: "value", label: "Value", type: "text" },
          { name: "label", label: "Label", type: "text" },
        ],
      },
      { name: "founderName", label: "Founder name", type: "text" },
      { name: "founderTitle", label: "Founder title", type: "text" },
      { name: "ctaPrimary", label: "Primary button", type: "group", fields: linkFields },
      { name: "ctaSecondary", label: "Secondary button", type: "group", fields: linkFields },
    ],
  },
  {
    key: "about.problem",
    group: "About Page",
    label: "Why Atunluto Exists",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      {
        name: "items",
        label: "Problem blocks",
        type: "list",
        itemLabel: "Block",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "about.model",
    group: "About Page",
    label: "The Atunluto Model",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Intro text", type: "textarea" },
      {
        name: "values",
        label: "Values",
        type: "list",
        itemLabel: "Value",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "about.achievements",
    group: "About Page",
    label: "What We Have Done",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Intro text", type: "textarea" },
      {
        name: "items",
        label: "Achievements",
        type: "list",
        itemLabel: "Achievement",
        fields: [
          { name: "value", label: "Big number/text", type: "text" },
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "about.cta",
    group: "About Page",
    label: "Call-to-action",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Intro text", type: "textarea" },
      { name: "ctaLabel", label: "Button text", type: "text" },
    ],
  },

  // ─── Mission & Vision page ──────────────────────────────────────────────────
  {
    key: "mv.hero",
    group: "Mission & Vision Page",
    label: "Hero",
    fields: [
      { name: "badge", label: "Badge", type: "text" },
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Intro text", type: "textarea" },
      {
        name: "slides",
        label: "Image slider",
        type: "list",
        itemLabel: "Image",
        fields: [
          { name: "image", label: "Image", type: "image" },
          { name: "alt", label: "Alt text", type: "text" },
        ],
      },
      {
        name: "stats",
        label: "Stats",
        type: "list",
        itemLabel: "Stat",
        fields: [
          { name: "value", label: "Value", type: "text" },
          { name: "label", label: "Label", type: "text" },
        ],
      },
      { name: "foundedValue", label: "Founded badge value", type: "text" },
      { name: "foundedLabel", label: "Founded badge label", type: "text" },
      { name: "ctaPrimary", label: "Primary button", type: "group", fields: linkFields },
      { name: "ctaSecondary", label: "Secondary button", type: "group", fields: linkFields },
    ],
  },
  {
    key: "mv.mission",
    group: "Mission & Vision Page",
    label: "Mission section",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "statement", label: "Statement (large)", type: "textarea" },
      { name: "body", label: "Body text", type: "textarea" },
      {
        name: "goals",
        label: "Goals",
        type: "list",
        itemLabel: "Goal",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "mv.vision",
    group: "Mission & Vision Page",
    label: "Vision section",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "statement", label: "Statement (large)", type: "textarea" },
      { name: "body", label: "Body text", type: "textarea" },
      {
        name: "points",
        label: "Vision points",
        type: "list",
        itemLabel: "Point",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
        ],
      },
      {
        name: "stats",
        label: "Stats",
        type: "list",
        itemLabel: "Stat",
        fields: [
          { name: "value", label: "Value", type: "text" },
          { name: "label", label: "Label", type: "text" },
        ],
      },
    ],
  },
  {
    key: "mv.values",
    group: "Mission & Vision Page",
    label: "Core Values",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Intro text", type: "textarea" },
      {
        name: "values",
        label: "Values",
        type: "list",
        itemLabel: "Value",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "color", label: "Accent colour (hex)", type: "text" },
        ],
      },
    ],
  },
  {
    key: "mv.cta",
    group: "Mission & Vision Page",
    label: "Call-to-action",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Intro text", type: "textarea" },
      { name: "ctaPrimary", label: "Primary button", type: "group", fields: linkFields },
      { name: "ctaSecondary", label: "Secondary button", type: "group", fields: linkFields },
    ],
  },

  // ─── Manifestoes page ───────────────────────────────────────────────────────
  {
    key: "manifestoes.hero",
    group: "Manifestoes Page",
    label: "Hero",
    fields: [
      { name: "badge", label: "Badge", type: "text" },
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Intro text", type: "textarea" },
      {
        name: "slides",
        label: "Image slider",
        type: "list",
        itemLabel: "Image",
        fields: [
          { name: "image", label: "Image", type: "image" },
          { name: "alt", label: "Alt text", type: "text" },
        ],
      },
      {
        name: "stats",
        label: "Stats",
        type: "list",
        itemLabel: "Stat",
        fields: [
          { name: "value", label: "Value", type: "text" },
          { name: "label", label: "Label", type: "text" },
        ],
      },
      { name: "badgeCardValue", label: "Corner badge value", type: "text" },
      { name: "badgeCardLabel", label: "Corner badge label", type: "text" },
      { name: "ctaPrimary", label: "Primary button", type: "group", fields: linkFields },
      { name: "ctaSecondary", label: "Secondary button", type: "group", fields: linkFields },
    ],
  },
  {
    key: "manifestoes.items",
    group: "Manifestoes Page",
    label: "Manifesto entries",
    fields: [
      {
        name: "items",
        label: "Manifestos",
        type: "list",
        itemLabel: "Manifesto",
        fields: [
          { name: "title", label: "Title", type: "text" },
          { name: "subtitle", label: "Subtitle", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "target", label: "Target", type: "textarea" },
          { name: "timeline", label: "Timeline / scope", type: "textarea" },
          { name: "color", label: "Accent colour (hex)", type: "text" },
        ],
      },
    ],
  },
  {
    key: "manifestoes.cta",
    group: "Manifestoes Page",
    label: "Call-to-action",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "intro", label: "Intro text", type: "textarea" },
      { name: "ctaLabel", label: "Button text", type: "text" },
    ],
  },
];

// Ordered list of page groups for the dashboard tabs.
export const CMS_GROUPS = [
  "Site-wide",
  "Home Page",
  "About Page",
  "Mission & Vision Page",
  "Manifestoes Page",
];

export function getSchema(key) {
  return CMS_SCHEMA.find((s) => s.key === key) ?? null;
}
