import React from "react";

/**
 * A tiny, safe markdown renderer for dish notes. Supports a deliberately small
 * subset: bracket-paren links, bold, italic, bare-URL autolink, and line breaks.
 * Nothing else is interpreted, so raw HTML in notes renders as literal text
 * (React builds elements, never dangerouslySetInnerHTML).
 *
 * Security: the only injection surface is a link's href, so every URL is passed
 * through safeHref(), which permits only http(s) and mailto and drops everything
 * else (javascript:, data:, vbscript:, and so on). Unsafe links become plain text.
 */

const SAFE_URL_RE = /^(https?:\/\/|mailto:)/i;

/** Return a safe href, or null if the URL scheme isn't allowed. */
export function safeHref(url: string): string | null {
  const u = (url ?? "").trim();
  if (!u) return null;
  return SAFE_URL_RE.test(u) ? u : null;
}

// One master tokenizer: link | bold | italic | bare-url. Order matters — link and
// bold are matched before italic so "**x**" isn't eaten by the single-* rule.
const TOKEN_RE = /(\[[^\]]+\]\([^)\s]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*|_[^_]+_)|(https?:\/\/[^\s)]+)/g;
const LINK_RE = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

const linkClass = "font-medium text-apb hover:underline";

function Anchor({ href, children, k }: { href: string; children: React.ReactNode; k: number }) {
  return (
    <a key={k} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
    </a>
  );
}

/** Parse one line of note text into React nodes (plain strings + inline elements). */
export function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = new RegExp(TOKEN_RE.source, "g");
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const [full, link, bold, ital, bare] = m;
    if (link) {
      const mm = LINK_RE.exec(link);
      const href = mm ? safeHref(mm[2]) : null;
      nodes.push(href ? <Anchor key={k} k={k} href={href}>{mm![1]}</Anchor> : (mm ? mm[1] : link));
    } else if (bold) {
      nodes.push(<strong key={k}>{bold.slice(2, -2)}</strong>);
    } else if (ital) {
      nodes.push(<em key={k}>{ital.slice(1, -1)}</em>);
    } else if (bare) {
      const href = safeHref(bare);
      nodes.push(href ? <Anchor key={k} k={k} href={href}>{bare}</Anchor> : bare);
    }
    last = m.index + full.length;
    k++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Render note text as sanitized inline markdown, preserving line breaks. */
export function NotesMarkdown({ text, className }: { text: string; className?: string }) {
  const lines = String(text ?? "").split("\n");
  return (
    <p className={className ?? "text-sm leading-relaxed text-neutral-700"}>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {renderInline(line)}
          {i < lines.length - 1 ? <br /> : null}
        </React.Fragment>
      ))}
    </p>
  );
}
