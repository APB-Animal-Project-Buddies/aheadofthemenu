// Reverse-lookup page: vegan diners search for a dish they're craving,
// see which local restaurants serve it.
//
// Data: /reverse-lookup/data/<city>.json — fetched on mount. Seattle only for now.
// Schema is documented in the JSON's `_schema` field.
//
// Ratings: schema reserves a `ratings` array on each restaurant entry; the UI
// shows a placeholder slot today. Wire in submission + display when the rating
// system ships — the averageRating() helper below is already ready to consume
// `{ stars, ... }` objects in that array.

const { useState, useEffect, useMemo } = React;

const SUBMIT_MAILTO =
  'mailto:animalprojectbuddies@gmail.com?subject=Reverse%20Lookup%20suggestion&body=Dish%3A%20%0AWhere%20you%20found%20it%3A%20%0AAnything%20else%20we%20should%20know%3A%20';

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('all');

  useEffect(() => {
    fetch('/reverse-lookup/data/seattle.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  // Derived: all unique tags across dishes, for the filter row.
  const tags = useMemo(() => {
    if (!data) return [];
    const seen = new Set();
    for (const d of data.dishes) {
      for (const t of d.tags || []) seen.add(t);
    }
    return Array.from(seen).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    // Split the query into whitespace-separated tokens and require ALL of them
    // to appear somewhere in the dish's haystack. This way "chocolate milkshake"
    // matches a Milkshake dish that has "chocolate" as a flavor — even though
    // the two words aren't adjacent in the source data.
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return data.dishes.filter((d) => {
      if (activeTag !== 'all' && !(d.tags || []).includes(activeTag)) return false;
      if (tokens.length === 0) return true;
      const haystack = [
        d.name,
        d.description,
        ...(d.ingredients || []),
        ...(d.tags || []),
        ...(d.flavors || []),
        ...((d.allergens || []).map((a) => a.name)),
        ...(d.restaurants || []).map((r) => `${r.name} ${r.city || ''}`),
      ]
        .join(' ')
        .toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }, [data, query, activeTag]);

  if (error) {
    return (
      <div className="rl-container">
        <div className="rl-error">Couldn't load the catalog: {error}</div>
      </div>
    );
  }

  return (
    <>
      <section className="rl-hero">
        <div className="rl-hero-inner">
          <span className="rl-eyebrow">Reverse Lookup · Seattle</span>
          <h1 className="rl-title">
            Tell us what you're craving — we'll tell you <em>where to find it vegan</em>.
          </h1>
          <p className="rl-subtitle">
            A growing catalog of plant-based dishes around the {data ? data.cityLabel : 'Seattle area'},
            mapped to the local restaurants that serve them. Search by dish, ingredient, or neighbourhood.
          </p>
        </div>
      </section>

      <div className="rl-container">
        <div className="rl-city-pill">
          <span className="rl-city-pill-dot" aria-hidden="true" />
          {data ? data.cityLabel : 'Seattle area'}{' '}
          <span className="rl-city-pill-soft">· more cities coming</span>
        </div>

        {!data ? (
          <div className="rl-loading">Loading the catalog…</div>
        ) : (
          <>
            <div className="rl-controls">
              <div className="rl-search-row">
                <div className="rl-search-wrap">
                  <SearchIcon />
                  <input
                    type="search"
                    className="rl-search"
                    placeholder='Try "breakfast burrito", "tofu", "milkshake"…'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search dishes"
                  />
                </div>
                <div className="rl-result-count">
                  {filtered.length} {filtered.length === 1 ? 'dish' : 'dishes'}
                </div>
              </div>

              {tags.length > 0 ? (
                <div className="rl-tag-row" role="group" aria-label="Filter by category">
                  <span className="rl-tag-label">Category</span>
                  <button
                    type="button"
                    className={`rl-tag-chip ${activeTag === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTag('all')}
                  >
                    All
                  </button>
                  {tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`rl-tag-chip ${activeTag === t ? 'active' : ''}`}
                      onClick={() => setActiveTag(t === activeTag ? 'all' : t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {filtered.length === 0 ? (
              <div className="rl-empty">
                <div className="rl-empty-title">No matches yet</div>
                <div>
                  The catalog is brand new — got a vegan dish you've found locally?{' '}
                  <a href={SUBMIT_MAILTO}>Tell us about it</a> and we'll add it.
                </div>
              </div>
            ) : (
              <ul className="rl-dish-list">
                {filtered.map((dish) => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </ul>
            )}

            <div className="rl-submit-card">
              <h2 className="rl-submit-title">Spotted a vegan dish worth listing?</h2>
              <p className="rl-submit-body">
                We're building this from the ground up. Send us the dish, the restaurant, and one line on
                what makes it special — we'll get it on the page.
              </p>
              <a className="rl-submit-btn" href={SUBMIT_MAILTO}>
                Suggest a dish
              </a>
            </div>

            <footer className="rl-footer">
              <p>
                A diner rating system is on the roadmap. Until then,{' '}
                <a href={SUBMIT_MAILTO}>email us</a> with your recommendations.
              </p>
            </footer>
          </>
        )}
      </div>
    </>
  );
}

function DishCard({ dish }) {
  const primaryTag = (dish.tags && dish.tags[0]) || null;
  const hasFlavors = dish.flavors && dish.flavors.length > 0;
  const hasAllergens = dish.allergens && dish.allergens.length > 0;
  return (
    <li className="rl-dish">
      <div className="rl-dish-head">
        <h2 className="rl-dish-name">{dish.name}</h2>
        {dish.locallyMade ? <span className="rl-badge">locally made</span> : null}
        {primaryTag ? <span className="rl-tag-pill">{primaryTag}</span> : null}
      </div>
      <p className="rl-dish-desc">{dish.description}</p>

      {hasFlavors ? (
        <div className="rl-detail-row">
          <span className="rl-detail-label">Flavors</span>
          <ul className="rl-flavor-list">
            {dish.flavors.map((f) => (
              <li key={f} className="rl-flavor">
                {f}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {dish.ingredients && dish.ingredients.length > 0 ? (
        <div className="rl-detail-row">
          <span className="rl-detail-label">Key ingredients</span>
          <ul className="rl-ingredients">
            {dish.ingredients.map((ing) => (
              <li key={ing} className="rl-ingredient">
                {ing}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasAllergens ? (
        <div className="rl-detail-row">
          <span className="rl-detail-label">Allergens</span>
          <ul className="rl-allergen-list">
            {dish.allergens.map((a) => (
              <li
                key={a.name}
                className={`rl-allergen ${a.optional ? 'is-optional' : 'is-always'}`}
                title={a.optional ? 'Only in some configurations' : 'Always present'}
              >
                <span className="rl-allergen-name">{a.name}</span>
                {a.optional ? <span className="rl-allergen-flag">optional</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rl-where">
        <div className="rl-where-label">Where to find it</div>
        <ul className="rl-restaurants">
          {dish.restaurants.map((r) => (
            <RestaurantRow key={`${r.name}-${r.city}`} restaurant={r} />
          ))}
        </ul>
      </div>
    </li>
  );
}

function RestaurantRow({ restaurant }) {
  const { name, city, url, address, notes, ratings } = restaurant;
  return (
    <li className="rl-restaurant">
      <div className="rl-restaurant-main">
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="rl-restaurant-name">
            {name}
          </a>
        ) : (
          <span className="rl-restaurant-name">{name}</span>
        )}
        {city ? <span className="rl-restaurant-city">· {city}</span> : null}
      </div>
      {address ? <div className="rl-restaurant-addr">{address}</div> : null}
      {notes ? <div className="rl-restaurant-notes">{notes}</div> : null}
      <div className="rl-rating-slot" aria-label="Rating">
        {ratings && ratings.length > 0 ? (
          <span className="rl-rating">
            ★ {averageRating(ratings).toFixed(1)} ({ratings.length})
          </span>
        ) : (
          <span className="rl-rating-empty">No ratings yet</span>
        )}
      </div>
    </li>
  );
}

function SearchIcon() {
  return (
    <svg
      className="rl-search-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function averageRating(ratings) {
  if (!ratings.length) return 0;
  const sum = ratings.reduce((acc, r) => acc + (r.stars || 0), 0);
  return sum / ratings.length;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
