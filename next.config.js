/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static files are served from public/
  async redirects() {
    return [
      // "Reverse Lookup" was renamed to "Eat This!" — keep old links working.
      { source: "/reverse-lookup", destination: "/eat-this", permanent: true },
      // "Revamp" was renamed to "Getting Started". The old path shipped to
      // production, so keep it resolving rather than 404ing anyone who saved it.
      { source: "/revamp", destination: "/getting-started", permanent: true },
    ];
  },
};

module.exports = nextConfig;
