/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static files are served from public/
  async redirects() {
    return [
      // "Reverse Lookup" was renamed to "Eat This!" — keep old links working.
      { source: "/reverse-lookup", destination: "/eat-this", permanent: true },
      // /recipes is temporarily deprecated pending a terms-of-use review of the
      // external sources it pulls from. Non-permanent so it's cleanly reversible.
      { source: "/recipes", destination: "/dishes", permanent: false },
    ];
  },
};

module.exports = nextConfig;
