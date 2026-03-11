/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure Node.js runtime for API routes
  serverExternalPackages: ['better-sqlite3'],
  
  // Configure Turbopack
  turbopack: {},
  
  // Use webpack instead of Turbopack for better-sqlite3 compatibility
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('better-sqlite3');
    }
    return config;
  },
};

module.exports = nextConfig;
