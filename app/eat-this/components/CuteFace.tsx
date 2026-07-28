"use client";

/**
 * Cute SVG face — ported verbatim from the Yum Lookup style sample
 * (docs/superpowers/specs/assets/yum-lookup-sample/app.jsx). Simple geometric
 * primitives: mood-driven mouth, heart eyes for "love", cheeks, leaf sprig.
 * Tallying/empty states pass fill="#D6D3CE" for the gray preset.
 */
export type Mood = "love" | "happy" | "smile" | "neutral" | "sad";

export function CuteFace({
  mood = "happy",
  size = 44,
  fill = "#FFD980",
  stroke = "#1C3A2E",
}: {
  mood?: Mood;
  size?: number;
  fill?: string;
  stroke?: string;
}) {
  // mood → mouth path
  const mouths: Record<Mood, string> = {
    love: "M 14 26 Q 22 36 30 26",
    happy: "M 14 25 Q 22 32 30 25",
    smile: "M 15 26 Q 22 30 29 26",
    neutral: "M 15 28 L 29 28",
    sad: "M 15 30 Q 22 24 29 30",
  };
  const eye = mood === "love" ? "heart" : "dot";
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} style={{ display: "block" }}>
      <circle cx="22" cy="22" r="20" fill={fill} stroke={stroke} strokeWidth="2" />
      {/* cheeks for happier moods */}
      {(mood === "love" || mood === "happy") && (
        <g opacity="0.55">
          <circle cx="11" cy="26" r="2.6" fill="#E89A8E" />
          <circle cx="33" cy="26" r="2.6" fill="#E89A8E" />
        </g>
      )}
      {/* eyes */}
      {eye === "heart" ? (
        <g fill={stroke}>
          <path d="M14 16 a2.4 2.4 0 0 1 4 0 a2.4 2.4 0 0 1 4 0 q 0 3 -4 5.4 q -4 -2.4 -4 -5.4 z" transform="translate(-3 -1)" />
          <path d="M14 16 a2.4 2.4 0 0 1 4 0 a2.4 2.4 0 0 1 4 0 q 0 3 -4 5.4 q -4 -2.4 -4 -5.4 z" transform="translate(11 -1)" />
        </g>
      ) : (
        <g fill={stroke}>
          <circle cx="15" cy="18" r="2.2" />
          <circle cx="29" cy="18" r="2.2" />
          {mood === "sad" && (
            <g stroke={stroke} strokeWidth="1.4" strokeLinecap="round">
              <line x1="12" y1="14" x2="18" y2="16" />
              <line x1="26" y1="16" x2="32" y2="14" />
            </g>
          )}
        </g>
      )}
      {/* mouth */}
      <path d={mouths[mood]} stroke={stroke} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* little leaf sprig for vegan flair */}
      <g transform="translate(32 2)">
        <path d="M0 6 Q 3 -2 9 0 Q 7 6 0 6 Z" fill="#7BB069" stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
        <line x1="0" y1="6" x2="9" y2="0" stroke={stroke} strokeWidth="0.8" />
      </g>
    </svg>
  );
}
