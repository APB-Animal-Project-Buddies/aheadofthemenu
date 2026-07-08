// Shared "Ahead of the Menu" top nav. Injected into pages so the link list
// stays in one place — keep the tab sets in sync with components/SiteNav.tsx
// so the emerald bar is identical across the static apps and the Next pages.
//
// Usage: <body data-active-nav="menus | recipes | dishes | dairy | reverse">
//        <script src="/recipes/site-nav.js"></script>
//
// The script renders the nav into <div id="site-nav-mount"></div> if present,
// otherwise it prepends to <body>.
//
// Tabs depend on account mode: business accounts get the operator tools
// (recipes, menus); consumers — and signed-out visitors — get the diner tools
// (dishes, reverse lookup); both share Top Alternatives. Mode comes from the
// Nhost session the Next app persists in localStorage ("nhostSession").

(function () {
  const CONSUMER_TABS = [
    { id: 'dishes',   href: '/dishes',           label: 'Dishes' },
    { id: 'dairy',    href: '/top-alternatives', label: 'Top Alternatives' },
    { id: 'reverse',  href: '/reverse-lookup',   label: 'Reverse Lookup' },
  ];
  const BUSINESS_TABS = [
    { id: 'menus',    href: '/menus',            label: 'Menus' },
    { id: 'recipes',  href: '/recipes',          label: 'Recipes' },
    { id: 'dairy',    href: '/top-alternatives', label: 'Top Alternatives' },
    { id: 'tips',     href: '/tips-and-tricks',  label: 'Tips & Tricks' },
    { id: 'reverse',  href: '/reverse-lookup',   label: 'Reverse Lookup' },
  ];

  // The session object the Nhost SDK persists; null when signed out or unreadable.
  function readSession() {
    try {
      return JSON.parse(localStorage.getItem('nhostSession')) || null;
    } catch {
      return null;
    }
  }

  function render() {
    const session = readSession();
    const userType =
      session && session.user && session.user.metadata
        ? session.user.metadata.user_type
        : null;

    const active = (document.body && document.body.dataset.activeNav) || '';
    const hash = (window.location.hash || '').replace(/^#/, '');
    // Mode: signed in → account type wins; else the entry section decides (business-only
    // pages → business, /dishes → consumer); on ambivalent pages the #business/#consumer
    // param carries it forward (no param → consumer).
    const BUSINESS_SECTIONS = ['recipes', 'menus', 'tips'];
    const CONSUMER_SECTIONS = ['dishes'];
    const mode = session
      ? (userType === 'business' ? 'business' : 'consumer')
      : BUSINESS_SECTIONS.indexOf(active) !== -1 ? 'business'
      : CONSUMER_SECTIONS.indexOf(active) !== -1 ? 'consumer'
      : hash === 'business' ? 'business'
      : 'consumer';
    const TABS = mode === 'business' ? BUSINESS_TABS : CONSUMER_TABS;
    const links = TABS
      .map(t => `<li><a href="${t.href}#${mode}"${t.id === active ? ' class="active"' : ''}>${t.label}</a></li>`)
      .join('');

    // Right side mirrors the Next nav: profile link when signed in, otherwise
    // log in / sign up. (Auth pages themselves live in the Next app.)
    const auth = session
      ? `<a class="nav-auth-profile" href="/profile">Profile</a>`
      : `<a class="nav-auth-login" href="/login">Log in</a>
         <a class="nav-auth-signup" href="/register">Sign up</a>`;

    const html = `
      <nav class="recipes-nav">
        <div class="recipes-nav-inner">
          <div class="recipes-brand">
            <a href="/" class="brand-link">
              <span class="leaf-mark" aria-hidden="true"></span>
              <span class="wordmark">Ahead of the <span style="color:#ff6b35;font-style:italic;">Menu</span></span>
            </a>
          </div>
          <button class="nav-burger" type="button" aria-label="Menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
          <ul class="recipes-nav-links">${links}</ul>
          <div class="recipes-nav-right">
            <div class="nav-auth">${auth}</div>
            <div id="nav-menu-pill-slot"></div>
          </div>
        </div>
      </nav>
    `;

    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    const navEl = wrap.firstElementChild;

    // Replace the mount on first render, or the already-rendered nav on a re-render
    // (so a hashchange swaps the bar in place instead of prepending a duplicate).
    const mount = document.getElementById('site-nav-mount') || document.querySelector('nav.recipes-nav');
    if (mount) {
      mount.replaceWith(navEl);
    } else {
      document.body.insertBefore(navEl, document.body.firstChild);
    }

    // Mobile hamburger toggle
    const burger = navEl.querySelector('.nav-burger');
    if (burger) {
      burger.addEventListener('click', function () {
        const open = navEl.classList.toggle('nav-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    navEl.querySelectorAll('.recipes-nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        navEl.classList.remove('nav-open');
        if (burger) burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
  // Re-render when the mode param changes (address-bar edit, back/forward) so the bar
  // reflects #business/#consumer without a full page reload.
  window.addEventListener('hashchange', render);
})();
