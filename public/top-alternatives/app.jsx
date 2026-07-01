// Top Alternatives — renders Plant-Based Dairy + Plant-Based Meat sections.

function App() {
  const dairy = window.APB_DAIRY || null;
  const meats = window.APB_MEATS || null;

  if (!dairy && !meats) {
    return (
      <div className="empty-state">
        <h3>Data missing</h3>
        <p>Ensure _dairy.js and _meats.js are loaded.</p>
      </div>
    );
  }

  // Split each section into strong (≥40% same-or-better OR has TASTY/parity)
  // and improving (still-developing) cards. Improving cards from dairy + meat
  // get merged into a single "Still Developing" section at the very bottom.
  function isStrong(c) {
    if (c.tasteParity || c.tastyAward) return true;
    if ((c.picks || []).some(p => p.tasteParity || p.tastyAward)) return true;
    if (c.sameOrBetterPct != null && c.sameOrBetterPct >= 40) return true;
    return false;
  }
  function split(data, parityLabel) {
    if (!data) return { strong: null, weak: [], parityLabel };
    const strong = data.categories.filter(isStrong);
    const weak = data.categories.filter(c => !isStrong(c));
    return {
      strong: strong.length ? { ...data, categories: strong } : null,
      weak: weak.map(c => ({ ...c, _parityLabel: parityLabel })),
      parityLabel,
    };
  }

  const meatSplit = split(meats, 'As good as meat');
  const dairySplit = split(dairy, 'As good as dairy');
  const allWeak = [...meatSplit.weak, ...dairySplit.weak];

  return (
    <main style={{ paddingBottom: 96 }}>
      <section style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '40px 32px 16px',
      }}>
        <h1 style={{
          fontFamily: 'var(--serif)',
          fontWeight: 600,
          fontSize: 'clamp(38px, 5vw, 56px)',
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          color: 'var(--moss-ink)',
          margin: 0,
        }}>Top Alternatives</h1>
        <p style={{
          maxWidth: 760,
          marginTop: 16,
          fontSize: 16,
          lineHeight: 1.6,
          color: 'oklch(0.18 0.04 145 / 0.72)',
        }}>
          Inspired by the{' '}
          <a
            href="https://www.nectar.org/sensory-research/2025-taste-of-the-industry"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--terracotta)', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >TASTY Awards from Nectar</a>
          {' '}— independent blind sensory testing of plant-based meat (2025)
          and dairy (2026) that involved over <strong>2,000+ tasters</strong>!
          Psst… we've layered in our own Ahead of the Menu picks for premium cuts
          the study didn't cover.
        </p>

        <details style={{
          maxWidth: 760,
          marginTop: 14,
          padding: '12px 16px',
          borderRadius: 14,
          border: '1px solid var(--line-soft)',
          background: 'var(--paper)',
          fontSize: 14,
          lineHeight: 1.55,
          color: 'oklch(0.18 0.04 145 / 0.72)',
        }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--moss-ink)' }}>
            How the test works
          </summary>
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            <p style={{ margin: 0 }}>
              Each plant-based product is tasted <strong>blind</strong> against its
              animal counterpart by a panel of ~100 omnivore and flexitarian
              consumers. Tasters rate overall liking on a 7-point scale; Nectar
              scores the difference using a Wilcoxon Signed-Rank test.
            </p>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                <strong>Meat 2025:</strong> 14 plant-based meat categories ·{' '}
                <strong>2,600+ tasters total</strong> · ~100 per category test.
              </li>
              <li>
                <strong>Dairy 2026:</strong> 10 plant-based dairy categories ·{' '}
                <strong>2,183 tasters total</strong> (with Palate Insights).
              </li>
            </ul>
            <p style={{ margin: 0 }}>
              A product earns a <strong>TASTY Award</strong> when at least
              <strong> 50%</strong> of tasters rate it "same or better" than the
              animal benchmark on overall liking. <strong>Taste parity</strong>{' '}
              (our orange "As good as ..." chip) means there was no statistically
              significant difference vs. the animal — only four meat products hit
              that bar in 2025.
            </p>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
              Juicy Marbles and Chunk Foods products in this list are{' '}
              <strong>APB Test Kitchen recommendations</strong> — not Nectar-tested.
            </p>
          </div>
        </details>
      </section>
      {meatSplit.strong && (
        <window.AlternativesTab
          data={meatSplit.strong}
          sectionLabel="Plant-Based Meat"
          parityLabel="As good as meat"
        />
      )}
      {meats?.apbRecommended && (
        <window.AlternativesTab
          data={meats.apbRecommended}
          sectionLabel="APB Recommends · Premium Cuts"
          parityLabel="APB pick"
        />
      )}
      {dairySplit.strong && (
        <window.AlternativesTab
          data={dairySplit.strong}
          sectionLabel="Plant-Based Dairy"
          parityLabel="As good as dairy"
        />
      )}
      {allWeak.length > 0 && (
        <window.AlternativesTab
          data={{
            categories: allWeak,
            headline: "Categories where the leader hasn't hit the 40% same-or-better bar yet — strong R&D opportunities for restaurateurs and brands alike.",
          }}
          sectionLabel="Still Developing"
          parityLabel="Same as animal"
        />
      )}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
