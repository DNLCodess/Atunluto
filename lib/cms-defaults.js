// lib/cms-defaults.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for all editable, public-facing website content.
//
// Every section below mirrors what used to be hard-coded inside the page/
// component. The website renders DEFAULTS merged over whatever the admin has
// saved in the `site_content` table, so the site keeps working before anything
// is edited, and gracefully falls back if a saved value is missing.
//
// Keys here MUST match the section keys used by the components and by
// lib/cms-schema.js (the dashboard editor).
// ─────────────────────────────────────────────────────────────────────────────

export const CMS_DEFAULTS = {
  // ─── Site-wide (navbar + footer) ───────────────────────────────────────────
  "site.settings": {
    brandName: "ATUNLUTO",
    logo: "/logo.png",
    navLinks: [
      { name: "Home", href: "/" },
      { name: "About Us", href: "/about" },
      { name: "Mission", href: "/mission-vision" },
      { name: "Manifesto", href: "/manifestoes" },
      { name: "Gallery", href: "/gallery" },
    ],
    joinCtaLabel: "Join Us",
    footerBrand: "ATUNLUTO GROUP",
    footerBlurb:
      "Driving a new era of responsible leadership, development-focused politics, and community empowerment across Oyo South and beyond.",
    contact: {
      email: "atunlutogroup@gmail.com",
      whatsapp: "+2349157413851",
      tel: "+2349121212110",
      address: "17B Adeyi Avenue, Bodija estate Ibadan Oyo State Nigeria",
    },
    social: [
      {
        platform: "TikTok",
        href: "https://www.tiktok.com/@atunluto.group?_r=1&_t=ZS-92kRZVZlGa5",
      },
      {
        platform: "Instagram",
        href: "https://www.instagram.com/atunlutogroup?igsh=b3pyeTMxdmNvd3Rr",
      },
    ],
  },

  // ─── Home page ──────────────────────────────────────────────────────────────
  "home.hero": {
    slides: [
      {
        image: "/hero2.jpg",
        title: "Our Motto",
        subtitle: "Iṣẹ Loogun iṣẹ",
        description:
          "800+ change makers across 5 LGAs working together for agriculture, healthcare, education, and more.",
      },
      {
        image: "/hero1.jpg",
        title: "RESCUE OYO SOUTH",
        subtitle: "Through Shared Responsibility",
        description:
          "We are not waiting for change. We are funding it ourselves through our cooperative system.",
      },
      {
        image: "/hero3.jpg",
        title: "RESCUE OUR NIGERIA",
        subtitle: "One Office At A Time",
        description:
          "Join the movement for cooperative politics and grassroots empowerment in Oyo South Senatorial District.",
      },
    ],
    ctaPrimary: { label: "Join the Movement", href: "/join-us" },
    ctaSecondary: { label: "Read Our Manifesto", href: "/manifestoes" },
  },

  "home.about": {
    heading: "About Atunluto Group",
    paragraphs: [
      "Atunluto Group is a political association of men and women committed to transforming Oyo South Senatorial District through cooperative politics and shared responsibility.",
      "Founded in March 2024, we operate on a simple principle: politics should serve the people, not personal interests. Our members fund and own the political structure, ensuring accountability from the ground up.",
      "We sponsor competent candidates from our ranks, hold them accountable, and maintain the power to remove leaders who fail to deliver on their promises to the community.",
    ],
    quote:
      "We are not waiting for change. We are funding it ourselves—through shared responsibility and cooperative action.",
  },

  "home.missionVision": {
    heading: "Mission & Vision",
    mission: {
      text: "To work hard and free our people from multidimensional poverty and move them into financial independence.",
      points: [
        "Cooperative politics",
        "Grassroots empowerment",
        "Economic freedom",
      ],
    },
    vision: {
      text: "A Nigeria of prosperous people living in decent houses, with access to quality infrastructure and global opportunities, starting with Oyo South.",
      points: [
        "Quality healthcare & education",
        "Modern infrastructure",
        "Economic prosperity",
      ],
    },
    quote: {
      text: "We sponsor competent candidates, hold them accountable, and maintain the power to remove them if they fail to deliver.",
      attribution: "The Atunluto Model",
    },
  },

  "home.pillars": {
    eyebrow: "Strategic Framework",
    heading: "Six Pillars of Development",
    intro:
      "Our comprehensive approach to transforming Oyo South Senatorial District through evidence-based policy and grassroots implementation.",
    items: [
      {
        title: "Agriculture",
        focus: "10 tractors per agrarian LGA for farm mechanization",
        target: "Triple cultivated acres",
      },
      {
        title: "Healthcare",
        focus: "Health insurance for 500+ vulnerable per LGA",
        target: "All 9 LGAs covered",
      },
      {
        title: "Education",
        focus: "School repairs and teacher training upgrades",
        target: "Western standards trajectory",
      },
      {
        title: "Entrepreneurship",
        focus: "Interest-free loans and transport union support",
        target: "Coverage across 9 LGAs",
      },
      {
        title: "Tourism",
        focus: "Olokemeji reserves and Ibarapa mountain ranges",
        target: "Investor partnerships",
      },
      {
        title: "Transport",
        focus: "High-capacity CNG buses with route reorganization",
        target: "Reduced congestion",
      },
    ],
    stats: [
      { value: "2027", label: "Implementation from electoral wins" },
      { value: "9 LGAs", label: "Across Oyo South district" },
      { value: "4 Years", label: "To transform trajectory" },
    ],
  },

  "home.stats": {
    heading: "Our Impact in Numbers",
    subtitle:
      "Since March 2024, we have been building a movement for real change",
    items: [
      {
        value: 800,
        suffix: "+",
        label: "Members",
        description: "Committed to grassroots transformation",
      },
      {
        value: 5,
        suffix: "",
        label: "LGAs",
        description: "Active presence across Oyo South",
      },
      {
        value: 100,
        suffix: "+",
        label: "Businesses",
        description: "Supported with interest-free loans",
      },
      {
        value: 50,
        suffix: "+",
        label: "Students",
        description: "WAEC fees paid and schools supported",
      },
    ],
    bottomText: "Be part of the movement transforming Oyo South",
    ctaLabel: "Join Atunluto Group",
  },

  "home.cta": {
    heading: "Ready to Rescue Nigeria?",
    intro:
      "Join the Atunluto movement today. Together, we fund real change through cooperative politics—one office at a time.",
    benefits: [
      "Be part of a movement changing Nigerian politics",
      "Help sponsor competent leaders from our community",
      "Hold elected officials accountable",
      "Access our interest-free loan schemes",
      "Contribute to real development projects",
      "Join 800+ change makers across Oyo South",
    ],
    memberCount: "800+ Members",
    memberCountSub: "Already building the future",
    cardHeading: "Become a Change Maker",
    cardIntro:
      "Registration is quick and simple. Join us in building a better Oyo South and Nigeria.",
    checklistHeading: "What you'll need:",
    checklist: [
      "Full name and contact information",
      "Home address in Oyo South",
      "LGA, Ward, and Polling Unit details",
      "WhatsApp and Messenger contacts",
    ],
  },

  // ─── About page ───────────────────────────────────────────────────────────
  "about.hero": {
    badge: "Who We Are",
    heading: "About Atunluto Group",
    intro:
      "A political association of change makers committed to transforming Oyo South through cooperative politics—where members own the structure, sponsor candidates, and demand accountability.",
    slides: [
      { image: "/about1.jpg", alt: "Atunluto Group community meeting" },
      { image: "/about2.jpg", alt: "Members collaboration" },
      { image: "/about3.jpg", alt: "Grassroots empowerment" },
      { image: "/about4.jpg", alt: "Community development" },
    ],
    stats: [
      { value: "Mar 2024", label: "Founded" },
      { value: "5 LGAs", label: "Initial Reach" },
      { value: "800+", label: "Members" },
    ],
    founderName: "OTO",
    founderTitle: "Founder",
    ctaPrimary: { label: "Join Us Today", href: "/join-us" },
    ctaSecondary: { label: "Our Mission & Vision", href: "/mission-vision" },
  },

  "about.problem": {
    heading: "Why Atunluto Exists",
    items: [
      {
        title: "The Current System Breeds Poverty by Design",
        description:
          "Money politics makes politicians spend their last kobo to get into office, forcing them to steal once elected. Campaign handouts that could repair health centers or fix roads are consumed instead of invested in development.",
      },
      {
        title: "No Accountability Structure",
        description:
          "Politicians are not caucused, making impeachment impossible. They answer to individual sponsors rather than the collective good, leading to personal aggrandizement over public service.",
      },
      {
        title: "We Are the Problem",
        description:
          "Everyone wants change but expects others to change first. We wait for society to transform like Western countries we watch on TV, without doing what they do: thinking of others, working for the greater good, and separating governance from personal gain.",
      },
    ],
  },

  "about.model": {
    heading: "The Atunluto Model",
    intro:
      "Replicating the cooperative thrift system within the body polity of Oyo South",
    values: [
      {
        title: "Shared Responsibility",
        description:
          "Members fund the movement through contributions, not handouts from politicians",
      },
      {
        title: "Accountability",
        description:
          "We sponsor candidates and can impeach them if they fail to deliver",
      },
      {
        title: "Development Over Handouts",
        description:
          "Focus on infrastructure and systems, not temporary relief",
      },
      {
        title: "Cooperative Model",
        description: "Replicating the successful thrift system in politics",
      },
    ],
  },

  "about.achievements": {
    heading: "What We Have Done",
    intro: "Early interventions showing what Atunluto means in practice",
    items: [
      {
        value: "50+",
        title: "Education Support",
        description:
          "WAEC fees paid for students and bush cutting machines provided for school fields across three LGAs in Oyo South district.",
      },
      {
        value: "₦50K - ₦100K",
        title: "Interest-Free Loans",
        description:
          "Small traders receiving loans to grow their businesses. Beneficiaries who do well can move up from ₦50,000 to ₦75,000 and ₦100,000.",
      },
    ],
  },

  "about.cta": {
    heading: "Join the Political Caucus",
    intro:
      "Start the journey with us towards rescuing Nigeria, one office at a time",
    ctaLabel: "Become a Member",
  },

  // ─── Mission & Vision page ─────────────────────────────────────────────────
  "mv.hero": {
    badge: "Our Purpose & Direction",
    heading: "Mission & Vision",
    intro:
      "Our commitment to transforming Oyo South through cooperative politics and grassroots empowerment—guided by a clear purpose and bold vision for the future.",
    slides: [
      { image: "/hero1.jpg", alt: "Community gathering and empowerment" },
      { image: "/hero2.jpg", alt: "Agricultural development initiatives" },
      { image: "/hero3.jpg", alt: "Healthcare support programs" },
    ],
    stats: [
      { value: "2027", label: "Target Year" },
      { value: "9 LGAs", label: "Full Coverage" },
      { value: "6", label: "Key Priorities" },
    ],
    foundedValue: "March 2024",
    foundedLabel: "Est. by OTO",
    ctaPrimary: { label: "Read Our Mission", href: "#mission" },
    ctaSecondary: { label: "See Our Vision", href: "#vision" },
  },

  "mv.mission": {
    heading: "Our Mission",
    statement:
      "To work hard and free our people from multidimensional poverty and move them into financial independence.",
    body: "Through cooperative politics and grassroots mobilization, we create opportunities for economic empowerment, quality education, accessible healthcare, and sustainable development across Oyo South Senatorial District.",
    goals: [
      {
        title: "Financial Independence",
        description:
          "Move our people from multidimensional poverty to self-sufficiency through structured support systems",
      },
      {
        title: "Economic Empowerment",
        description:
          "Build sustainable income sources through cooperative business models and interest-free loans",
      },
      {
        title: "Community Development",
        description:
          "Strengthen social bonds and collective action for the greater good of Oyo South",
      },
    ],
  },

  "mv.vision": {
    heading: "Our Vision",
    statement:
      "To see a Nigeria populated by prosperous people capable of doing what others are doing in the Western world.",
    body: "Starting with Oyo South, we envision communities where every citizen has access to quality education, healthcare, infrastructure, and economic opportunities that match global standards.",
    points: [
      {
        title: "Prosperous Communities",
        description:
          "People living in decent houses with access to good roads, quality schools, and modern healthcare facilities",
      },
      {
        title: "Economic Opportunity",
        description:
          "Well-paying employment based on individual preferences and skills, matching standards in developed nations",
      },
      {
        title: "Quality Infrastructure",
        description:
          "Recreational facilities, transportation networks, and public services that rival Western standards",
      },
      {
        title: "Empowered Citizens",
        description:
          "Communities capable of self-governance and sustainable development without external dependency",
      },
    ],
    stats: [
      { value: "2027", label: "Target Year" },
      { value: "9 LGAs", label: "Full Coverage" },
    ],
  },

  "mv.values": {
    heading: "Our Core Values",
    intro: "The principles that guide every decision and action we take",
    values: [
      {
        title: "Transparency",
        description:
          "Open governance where members see how resources are spent and decisions are made",
        color: "#1b5e20",
      },
      {
        title: "Accountability",
        description:
          "Leaders answer to the collective, not individual sponsors or external interests",
        color: "#2e7d32",
      },
      {
        title: "Cooperation",
        description:
          "Shared responsibility and collective action—we rise together or not at all",
        color: "#4caf50",
      },
      {
        title: "Development",
        description:
          "Focus on systemic progress over handouts—building infrastructure, not dependency",
        color: "#66bb6a",
      },
    ],
  },

  "mv.cta": {
    heading: "Join Us in Building This Future",
    intro:
      "Our mission and vision require collective action. Be part of the movement transforming Oyo South through cooperative politics.",
    ctaPrimary: { label: "Join the Movement", href: "/join-us" },
    ctaSecondary: { label: "Read Our Manifestos", href: "/manifestoes" },
  },

  // ─── Manifestoes page ──────────────────────────────────────────────────────
  "manifestoes.hero": {
    badge: "Development Blueprint",
    heading: "Our Manifestos",
    intro:
      "Six strategic priorities for transforming Oyo South Senatorial District through evidence-based policy, grassroots implementation, and measurable outcomes.",
    slides: [
      { image: "/manifesto1.jpg", alt: "Agriculture development" },
      { image: "/manifesto2.jpg", alt: "Healthcare services" },
      { image: "/manifesto3.jpg", alt: "Education infrastructure" },
      { image: "/manifesto4.jpg", alt: "Community empowerment" },
    ],
    stats: [
      { value: "2027", label: "Target Start" },
      { value: "9 LGAs", label: "Full Coverage" },
      { value: "6", label: "Priority Areas" },
    ],
    badgeCardValue: "4 Years",
    badgeCardLabel: "Implementation",
    ctaPrimary: { label: "Read Details", href: "#agriculture" },
    ctaSecondary: { label: "Join the Movement", href: "/join-us" },
  },

  "manifestoes.items": {
    items: [
      {
        title: "Agriculture",
        subtitle: "Farm Mechanization",
        description:
          "We believe as agrarian societies, farm mechanization is the way forward. We will seek to have at least 10 brand new tractors in each agrarian LGA across Oyo South: Ibarapa North, Ibarapa Central, Ibarapa East, Ido, and Ibadan South West.",
        target:
          "Triple the number of acres currently cultivated across these LGAs",
        timeline: "Within 4 years from 2027 electoral wins",
        color: "#2E7D32",
      },
      {
        title: "Healthcare",
        subtitle: "Universal Health Insurance",
        description:
          "We will promote health insurance across all 9 LGAs in Oyo South. Atunluto will pay for at least 500 most vulnerable people per LGA and subsidize a further 500. We'll bring together HMO clusters to provide affordable schemes and promote hospital registrations into the national health insurance scheme.",
        target:
          "Specialist treatment accessible through hospital equipment adoption",
        timeline: "500+ vulnerable covered per LGA",
        color: "#E53935",
      },
      {
        title: "Education",
        subtitle: "Infrastructure, Teacher Development & Digital Literacy",
        description:
          "We will ensure office holders from this group work towards improvements in learning environments through repairs of existing structures, building new ones, and insisting on teacher upgrades so learning outcomes match Western world standards. We will provide digital and ICT training for WAEC students to help them excel in their CBT (Computer-Based Test) exams, ensuring our students are well-prepared for modern examination formats.",
        target:
          "Significant improvement in educational standards and digital literacy within 4 years",
        timeline:
          "Technical colleges upgraded with laboratory equipment and overseas volunteer teachers. ICT training centers established in schools to prepare WAEC students for CBT exams.",
        color: "#1976D2",
      },
      {
        title: "Entrepreneurship",
        subtitle: "Interest-Free Loans & Business Support",
        description:
          "We will continue granting loans to artisans, traders, farmers, and business owners to improve livelihoods. From 2027 electoral wins, we'll syndicate loans with commercial banks across Oyo South for broader reach.",
        target: "Coverage across all 9 LGAs",
        timeline: "Over 1 million SME loans in the first year alone",
        color: "#F57C00",
      },
      {
        title: "Tourism",
        subtitle: "Natural Heritage Development",
        description:
          "We intend to work with investors to revamp our tourism sector: Olokemeji forest reserves and mountain ranges in Ibarapa North. These attractions can rival Western tourist destinations where people pay huge sums for holidays.",
        target: "Alternative destination for Western tourists",
        timeline:
          "Partnerships with West African tourism groups (Gambia, Ghana) and local investors",
        color: "#00796B",
      },
      {
        title: "Transport",
        subtitle: "Modern Public Transit",
        description:
          "High-capacity CNG buses will reduce road congestion. We'll work with transport unions and government agencies to redraft routes so vehicles pass through inner residential areas like in other countries, reducing the need for long-distance okada rides.",
        target: "Reduced congestion and improved mobility",
        timeline:
          "Reorganize transport unions to access CNG buses on hire purchase",
        color: "#5E35B1",
      },
    ],
  },

  "manifestoes.cta": {
    heading: "Be Part of This Transformation",
    intro:
      "Join us in implementing these development priorities across Oyo South",
    ctaLabel: "Join Atunluto Group",
  },
};

// ─── Merge helpers ────────────────────────────────────────────────────────────
function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

// Deep-merge `override` onto `base`. Arrays and primitives in `override` replace
// those in `base` wholesale (the dashboard always saves complete arrays).
export function deepMerge(base, override) {
  if (override === undefined || override === null) return base;
  if (!isPlainObject(base) || !isPlainObject(override)) return override;

  const out = { ...base };
  for (const key of Object.keys(override)) {
    out[key] = isPlainObject(base[key]) && isPlainObject(override[key])
      ? deepMerge(base[key], override[key])
      : override[key];
  }
  return out;
}

// Returns the default content for a section key (deep-cloned).
export function getDefaultSection(key) {
  return deepMerge({}, CMS_DEFAULTS[key] ?? {});
}

// Merge a saved section over its defaults.
export function mergeSection(key, saved) {
  return deepMerge(CMS_DEFAULTS[key] ?? {}, saved ?? {});
}
