// Cute placeholder line-art SVG icons for the dairy category cards.
// Each icon uses currentColor so it tints with the parent's color.
// 48×48 viewBox, stroke-based, gentle rounding.

const ICON_PROPS = {
  width: 48,
  height: 48,
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const DAIRY_ICONS = {
  // Barista — coffee cup with steam swirls
  barista: (
    <svg {...ICON_PROPS}>
      <path d="M10 20h22v12a8 8 0 0 1-8 8h-6a8 8 0 0 1-8-8V20z" />
      <path d="M32 22h4a4 4 0 0 1 0 8h-4" />
      <path d="M16 8c-1 2 1 3 0 6M22 6c-1 2 1 3 0 6M28 8c-1 2 1 3 0 6" />
    </svg>
  ),

  // Milk — gable-top carton
  milk: (
    <svg {...ICON_PROPS}>
      <path d="M14 16l10-6 10 6v22a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V16z" />
      <path d="M14 16l10 4 10-4" />
      <path d="M24 20v6" />
      <path d="M19 30h10" />
    </svg>
  ),

  // Butter — block with foil ridges
  butter: (
    <svg {...ICON_PROPS}>
      <path d="M8 18l4-4h24l4 4v18a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V18z" />
      <path d="M14 14v-2M22 14v-2M30 14v-2M18 14v-2M26 14v-2M34 14v-2" />
      <path d="M14 24l8 6M22 22l8 8" />
    </svg>
  ),

  // Cheddar — wedge with holes
  cheddar: (
    <svg {...ICON_PROPS}>
      <path d="M6 36l32-16 4 8-32 16-4-8z" />
      <path d="M6 36l4 8" />
      <circle cx="20" cy="28" r="1.5" />
      <circle cx="28" cy="24" r="1.5" />
      <circle cx="14" cy="32" r="1.2" />
      <circle cx="32" cy="30" r="1.2" />
    </svg>
  ),

  // Mozzarella — fresh ball with whey droplets
  mozzarella: (
    <svg {...ICON_PROPS}>
      <circle cx="24" cy="26" r="12" />
      <path d="M16 20c2-1 4-1.5 6-1.5" />
      <path d="M10 12c0 2 1.5 3 1.5 4M38 14c0 2-1.5 3-1.5 4M24 6c0 2 1.5 3 1.5 4" />
      <circle cx="13" cy="40" r="1.2" />
      <circle cx="36" cy="42" r="1.2" />
    </svg>
  ),

  // Cream cheese — squat tub, rounded lid
  'cream-cheese': (
    <svg {...ICON_PROPS}>
      <path d="M10 18a14 4 0 0 1 28 0v18a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V18z" />
      <path d="M10 18a14 4 0 0 0 28 0" />
      <path d="M16 26h16M16 32h12" />
    </svg>
  ),

  // Creamer — small pitcher, spout, handle
  creamer: (
    <svg {...ICON_PROPS}>
      <path d="M10 18h22v18a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V18z" />
      <path d="M32 22h4a4 4 0 0 1 0 8h-4" />
      <path d="M10 18l4-6h14l4 6" />
      <path d="M16 30c2 0 2-2 4-2s2 2 4 2" />
    </svg>
  ),

  // Sour cream — round container with subtle lid line
  'sour-cream': (
    <svg {...ICON_PROPS}>
      <ellipse cx="24" cy="16" rx="14" ry="4" />
      <path d="M10 16v22a14 4 0 0 0 28 0V16" />
      <path d="M10 22a14 4 0 0 0 28 0" />
      <path d="M18 30c2 0 2-2 4-2s2 2 4 2 2-2 4-2" />
    </svg>
  ),

  // Yogurt — cup with peeled foil top
  yogurt: (
    <svg {...ICON_PROPS}>
      <path d="M12 14h24l-2 24a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2L12 14z" />
      <path d="M12 14c4-4 20-4 24 0" />
      <path d="M36 14l4-4" />
      <path d="M18 24c2 0 2-2 4-2s2 2 4 2 2-2 4-2" />
    </svg>
  ),

  // Ice cream — single scoop on a cone
  'ice-cream': (
    <svg {...ICON_PROPS}>
      <circle cx="24" cy="16" r="9" />
      <path d="M16 22l8 20 8-20" />
      <path d="M18 26l6 14 6-14" />
      <path d="M19 16c1-2 3-3 5-3" />
    </svg>
  ),
};

function DairyIcon({ name }) {
  return DAIRY_ICONS[name] || DAIRY_ICONS.milk;
}

Object.assign(window, { DAIRY_ICONS, DairyIcon });
