/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static files are served from public/
  async redirects() {
    return [
      // "Reverse Lookup" was renamed to "Eat This!" — keep old links working.
      { source: "/reverse-lookup", destination: "/creators", permanent: false },
      // Focus mode: the landing page IS "Upload your menu" (/getting-started).
      // app/page.tsx is kept for when a real landing page returns; delete this
      // redirect to bring it back.
      { source: "/", destination: "/getting-started", permanent: false },
      // The Menus page was removed — send old links to Upload Menu.
      { source: "/menus", destination: "/getting-started", permanent: false },
      // Tips & Tricks was folded into the Upload Menu page.
      { source: "/tips-and-tricks", destination: "/getting-started", permanent: false },
      // Eat This! is hidden for now (focus mode). Code + APIs are untouched; delete
      // these two redirects to bring the pages back (and restore the nav tab).
      { source: "/eat-this", destination: "/creators", permanent: false },
      { source: "/eat-this/:path*", destination: "/creators", permanent: false },
      // "Revamp" was renamed to "Getting Started". The old path shipped to
      // production, so keep it resolving rather than 404ing anyone who saved it.
      { source: "/revamp", destination: "/getting-started", permanent: true },
    ];
  },
};

module.exports = nextConfig;
