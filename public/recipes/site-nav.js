// Shared "Ahead of the Menu" top nav. Injected into pages so the link list
// stays in one place — add a tab here once and every page picks it up.
//
// Usage: <body data-active-nav="menus | recipes | dairy | tips">
//        <script src="/recipes/site-nav.js"></script>
//
// The script renders the nav into <div id="site-nav-mount"></div> if present,
// otherwise it prepends to <body>.

(function () {
  const TABS = [
    { id: 'menus',    href: '/menus',            label: 'Menus' },
    { id: 'recipes',  href: '/recipes',          label: 'Recipes' },
    { id: 'dairy',    href: '/top-alternatives', label: 'Top Alternatives' },
    { id: 'tips',     href: '/tips-and-tricks',  label: 'Tips & Tricks' },
  ];

  function render() {
    const active = (document.body && document.body.dataset.activeNav) || '';
    const links = TABS
      .map(t => `<li><a href="${t.href}"${t.id === active ? ' class="active"' : ''}>${t.label}</a></li>`)
      .join('');

    const html = `
      <nav class="recipes-nav">
        <div class="recipes-nav-inner">
          <div class="recipes-brand">
            <a href="/" class="brand-link">
              <span class="leaf-mark" aria-hidden="true"></span>
              <span class="wordmark">Ahead of the <span style="color:#ff6b35;font-style:italic;">Menu</span></span>
            </a>
            <div class="powered-by">powered by <a href="/" title="Animal Project Buddies">Animal Project Buddies</a></div>
          </div>
          <button class="nav-burger" type="button" aria-label="Menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
          <ul class="recipes-nav-links">${links}</ul>
          <div id="nav-menu-pill-slot"></div>
        </div>
      </nav>
    `;

    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    const navEl = wrap.firstElementChild;

    const mount = document.getElementById('site-nav-mount');
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
})();
