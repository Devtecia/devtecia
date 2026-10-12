/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Needed for a site wide 404 with one root layout per locale.
    globalNotFound: true,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
