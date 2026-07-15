/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static files are served from public/
  async redirects() {
    return [
      // "Reverse Lookup" was renamed to "Eat This!" — keep old links working.
      { source: "/reverse-lookup", destination: "/eat-this", permanent: true },
    ];
  },
};

module.exports = nextConfig;
