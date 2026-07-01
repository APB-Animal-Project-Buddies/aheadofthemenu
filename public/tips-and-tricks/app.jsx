// Tips & Tricks — magazine-style render of the Final Notes sections.
// Reads window.APB_TIPS (from /recipes/data/_tips.js).

const tips = window.APB_TIPS || [];
const lookup = window.APB_LOOKUP || {};

// The parser pre-bakes qualifier-stripped + tail variants into _lookup.json,
// so we only need to normalize the input here and check the map directly.
function normDish(s) {
  return String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/œ/g,'oe').replace(/æ/g,'ae')
    .replace(/\(([^)]+)\)/g, '')
    .replace(/[''"`]/g, '')
    .replace(/[^a-z0-9\s\-\/&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function dishHref(text) {
  const n = normDish(text);
  const id = lookup[n] || lookup[n.split('/')[0].trim()];
  return id ? `/recipes#r=${id}` : null;
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Inline markdown → safe HTML.
// Order: escape special chars first, then apply markdown patterns (which all
// use plain ASCII tokens that survive escaping). Bolded dish names that
// resolve in the lookup become anchors; other bolds stay as <strong>.
function inline(s) {
  if (!s) return '';
  let out = escHtml(String(s));
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_, text, url) => `<a class="ext-link" href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);
  out = out.replace(/==([^=]+)==/g, '<span class="accent-green">$1</span>');
  out = out.replace(/\*\*([^*]+)\*\*/g, (_, inner) => {
    const href = dishHref(inner);
    return href
      ? `<a class="dish-link" href="${href}"><strong>${inner}</strong></a>`
      : `<strong>${inner}</strong>`;
  });
  out = out.replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, '$1<em>$2</em>$3');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\$(\d+(?:\.\d+)?)(?:[–\-—]\$?(\d+(?:\.\d+)?))?/g,
    (_, a, b) => b
      ? `<span class="price">$${a}–${b}</span>`
      : `<span class="price">$${a}</span>`);
  return out;
}

// Split a tip-section body into themed clusters keyed by their bold header.
// Body is markdown, structured like:
//   **Header A** (subtitle):
//   - bullet
//   - bullet
//
//   **Header B** (subtitle):
//   - bullet
function splitClusters(body) {
  const clusters = [];
  let current = null;
  let buf = [];

  function flush() {
    if (current) {
      current.body = buf.join('\n').trim();
      clusters.push(current);
    }
    current = null;
    buf = [];
  }

  const lines = body.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    // A header line is **Header text** optionally followed by ":" or " (subtitle)"
    const headerMatch = line.match(/^\*\*([^*]+)\*\*\s*(?:\(([^)]+)\))?\s*[:.]?\s*$/);
    // Guard against bullet rows ("- foo" / "* foo") but allow standalone **bold** headers.
    if (headerMatch && !/^[-*]\s/.test(line)) {
      flush();
      current = { title: headerMatch[1].trim(), subtitle: headerMatch[2]?.trim() || null, body: '' };
      continue;
    }
    if (current) {
      buf.push(raw);
    } else if (line) {
      // Body content before any header — treat as intro.
      if (!clusters.length || clusters[0].title !== '__intro__') {
        clusters.unshift({ title: '__intro__', subtitle: null, body: '' });
      }
      clusters[0].body += (clusters[0].body ? '\n' : '') + raw;
    }
  }
  flush();
  return clusters;
}

// Render a body string (after splitClusters) into either a list of dish cards
// (when bullets contain a $price tier) or a plain bullet list.
function renderClusterBody(body) {
  const lines = body.split(/\r?\n/);
  const items = [];
  let buf = [];

  function flushPara() {
    if (buf.length) {
      items.push({ kind: 'p', text: buf.join(' ').trim() });
      buf = [];
    }
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushPara(); continue; }
    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (ulMatch) { flushPara(); items.push({ kind: 'ul', text: ulMatch[1] }); continue; }
    if (olMatch) { flushPara(); items.push({ kind: 'ol', text: olMatch[1] }); continue; }
    buf.push(line);
  }
  flushPara();

  // Are these dish-card bullets (contain a $price tier or em-dash separator)?
  const isDishCards = items.length >= 3 &&
    items.every(it => it.kind === 'ul') &&
    items.filter(it => /\$\d+/.test(it.text)).length >= Math.ceil(items.length * 0.5);

  if (isDishCards) {
    return (
      <div className="dish-grid">
        {items.map((it, i) => {
          const parts = it.text.split(/\s+—\s+/);
          const head = parts[0];
          const rest = parts.slice(1).join(' — ');
          // Strip markdown bold from head for lookup
          const headPlain = head.replace(/\*\*/g, '');
          const href = dishHref(headPlain);
          const headHtml = inline(head);
          return (
            <article key={i} className="dish-pill">
              {href
                ? <a className="dish-name dish-link" href={href} dangerouslySetInnerHTML={{ __html: headHtml }} />
                : <div className="dish-name" dangerouslySetInnerHTML={{ __html: headHtml }} />}
              {rest && <div className="dish-meta" dangerouslySetInnerHTML={{ __html: inline(rest) }} />}
            </article>
          );
        })}
      </div>
    );
  }

  // Otherwise plain blocks (paragraphs + simple lists)
  const blocks = [];
  let listType = null;
  let listBuf = [];
  function flushList() {
    if (listBuf.length) {
      const Tag = listType === 'ol' ? 'ol' : 'ul';
      blocks.push(
        <Tag key={`l-${blocks.length}`} className={Tag === 'ol' ? 'numbered' : 'bulleted'}>
          {listBuf.map((t, j) => <li key={j} dangerouslySetInnerHTML={{ __html: inline(t) }} />)}
        </Tag>
      );
      listBuf = [];
      listType = null;
    }
  }
  for (const it of items) {
    if (it.kind === 'p') {
      flushList();
      blocks.push(<p key={`p-${blocks.length}`} dangerouslySetInnerHTML={{ __html: inline(it.text) }} />);
    } else {
      if (listType && listType !== it.kind) flushList();
      listType = it.kind;
      listBuf.push(it.text);
    }
  }
  flushList();
  return <>{blocks}</>;
}

// Quick-glance summary cards at the top: surface anchor / showcase / quick-service archetypes.
function ArchetypeStrip() {
  const cards = [
    {
      id: 'anchor',
      eyebrow: 'High-margin · Low-labor',
      title: 'Anchor dishes',
      blurb: 'Sub-$1.50 food cost. Holds 3+ days. Plates in <5 minutes.',
      examples: ['Dal makhani', 'Mole poblano', 'Mujadara', 'Cuban black beans', 'Hummus'],
    },
    {
      id: 'showcase',
      eyebrow: 'High-ticket · High-interest',
      title: 'Showcase plates',
      blurb: 'The destination dishes. Drive press, social, and check average.',
      examples: ['Beef Wellington', 'Bistecca alla Fiorentina', 'Picanha', 'Peking "Duck"', 'Bourguignon'],
    },
    {
      id: 'fast',
      eyebrow: 'Fast-service · Lunch volume',
      title: 'Quick-fire mains',
      blurb: 'Under 8 minutes from prepped components. Your $13–17 lunch tier.',
      examples: ['Pad thai', 'Bánh mì', 'Falafel', 'Bibimbap', 'Mac & cheese'],
    },
  ];
  return (
    <div className="archetype-strip">
      {cards.map(c => (
        <article key={c.id} className={`arch arch-${c.id}`}>
          <div className="eyebrow">{c.eyebrow}</div>
          <h3>{c.title}</h3>
          <p className="blurb">{c.blurb}</p>
          <ul className="examples">
            {c.examples.map(e => {
              const href = dishHref(e);
              return (
                <li key={e}>
                  {href ? <a href={href}>{e}</a> : e}
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </div>
  );
}

function App() {
  const { useMemo } = React;
  const renderedTips = useMemo(
    () => tips.map(t => ({ ...t, clusters: splitClusters(t.body) })),
    []
  );
  return (
    <>
      <section className="tips-hero">
        <div className="eyebrow"><span className="dot"/>Tips · Restaurant deployment guidance</div>
        <h1>
          Run a plant-based kitchen that <em>pays the rent</em>.
        </h1>
        <p className="lede">
          Where to put the high-margin items, where to lead with branded faux-meat, how to source it,
          and the menu-engineering tactics that turn a 28% food-cost dish into a 9% one.
        </p>
      </section>

      <ArchetypeStrip />

      <main className="tips">
        {tips.length === 0 ? (
          <div className="empty-state">
            <h3>Tips data missing</h3>
            <p>Run the parser:</p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 12, opacity: 0.7, marginTop: 12 }}>
              bun recipes/base_document/scripts/parse-catalog.ts
            </p>
          </div>
        ) : renderedTips.map((t, idx) => {
          const clusters = t.clusters;
          return (
            <article key={t.id} className="tip-section">
              <div className="tip-num">{String(idx + 1).padStart(2, '0')}</div>
              <h2>{t.title}</h2>
              <div className="tip-body">
                {clusters.map((cluster, i) => (
                  <section key={i} className={"cluster" + (cluster.title === '__intro__' ? ' intro' : '')}>
                    {cluster.title !== '__intro__' && (
                      <header className="cluster-head">
                        <h4>{cluster.title}</h4>
                        {cluster.subtitle && <span className="cluster-sub">{cluster.subtitle}</span>}
                      </header>
                    )}
                    {renderClusterBody(cluster.body)}
                  </section>
                ))}
              </div>
            </article>
          );
        })}
      </main>

      <footer className="foot">
        Source: <em>vegan-restaurant-catalog-v5.md</em> · Pricing reflects 2025–26 US foodservice rates · Verify quarterly with your distributor.
      </footer>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
