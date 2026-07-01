"use client";

// Plant-based tips shown (via sonner) as an auto-fading popup while dishes load.
// `w` weights the big-picture facts higher so they appear more often.
export const PLANT_FACTS = [
  { w: 3, t: "🌍 If the world went fully plant-based, we could free up almost 75% of farmland — room to rewild and let nature breathe. 🌳" },
  { w: 3, t: "🐮 If we all committed to plant-based, we'd spare over 200 billion animals every year. Imagine that much kindness. 💚" },
  { w: 3, t: "💧 If we all went plant-based, we'd save around 50% of the water used in agriculture. Every meal is a drop that adds up. 🌊" },
  { w: 3, t: "🦠 Up to 80% of the world's antibiotics go to farmed animals, not people — fueling drug-resistant superbugs. Going plant-based helps keep our medicines working. 💊" },
  { w: 1, t: "💧 Going plant-based for a day can save around 1,100 gallons of water — small plates, big ripples. 🌊" },
  { w: 1, t: "🌳 Each plant-based day spares roughly 30 sq ft of forest. Let's grow something kinder together. 🌱" },
  { w: 1, t: "🐮 Going plant-based can save around 200 animal lives a year — that's over 1,000 friends in just five years. 💚" },
  { w: 1, t: "☁️ A single plant-based day can cut about 20 lbs of CO₂. Cooking dinner can help cool the planet. 🌍" },
  { w: 1, t: "🌎 Plant-based eating uses a fraction of the land and water of animal farming — same plate, lighter footprint. 🌿" },
  { w: 1, t: "🐟 Going plant-based helps keep our oceans full of fish, not nets. 🌊" },
  { w: 1, t: "💚 Good food, done kindly. Thanks for cooking with compassion. 🐰" },
];

const TOTAL_WEIGHT = PLANT_FACTS.reduce((s, f) => s + f.w, 0);

// Weighted random index; re-rolls to avoid repeating the one currently shown.
export function pickWeighted(exclude = -1) {
  for (let tries = 0; tries < 8; tries++) {
    let r = Math.random() * TOTAL_WEIGHT;
    for (let k = 0; k < PLANT_FACTS.length; k++) {
      r -= PLANT_FACTS[k].w;
      if (r < 0) {
        if (k !== exclude) return k;
        break;
      }
    }
  }
  return (exclude + 1) % PLANT_FACTS.length;
}

// The themed card rendered inside a sonner toast.
export function TipCard({ text }) {
  return (
    <div
      style={{
        maxWidth: 320,
        padding: "14px 16px",
        borderRadius: 14,
        background: "rgba(17, 38, 25, 0.82)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 107, 53, 0.3)",
        color: "rgba(250, 248, 245, 0.92)",
        fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
        fontSize: 13.5,
        lineHeight: 1.5,
        boxShadow: "0 20px 50px -24px rgba(0,0,0,0.8)",
      }}
    >
      {text}
    </div>
  );
}

// Branded full-screen loader shown while dishes load. The rotating plant-based
// tip is rendered separately by the page (a sonner toast) so it can persist
// from the loader into the loaded page.
export function LoadingFacts() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 20,
        padding: 24,
        color: "#faf8f5",
        fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
        background:
          "radial-gradient(120% 90% at 85% 8%, rgba(45,122,62,0.38) 0%, transparent 55%), linear-gradient(155deg, #163320 0%, #112619 60%, #0d2014 100%)",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ff6b35"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6" />
        </svg>
        <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 25, fontWeight: 600, letterSpacing: "-0.01em" }}>
          Ahead of the{" "}
          <em style={{ color: "#ff6b35", fontStyle: "italic", fontWeight: 500 }}>Menu</em>
        </span>
      </span>

      <h3
        style={{
          margin: 0,
          fontFamily: "'Fraunces', Georgia, serif",
          fontWeight: 500,
          fontSize: 18,
          color: "rgba(250,248,245,0.82)",
        }}
      >
        Loading dishes…
      </h3>

      <span className="aotm-load-dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>

      <style>{`
        .aotm-load-dots { display: inline-flex; gap: 7px; }
        .aotm-load-dots i {
          width: 7px; height: 7px; border-radius: 50%;
          background: #ff6b35; display: inline-block;
          animation: aotm-bounce 1.2s infinite ease-in-out both;
        }
        .aotm-load-dots i:nth-child(2) { animation-delay: 0.16s; }
        .aotm-load-dots i:nth-child(3) { animation-delay: 0.32s; }
        @keyframes aotm-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.45; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
