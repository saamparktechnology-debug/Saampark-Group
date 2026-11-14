import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 1,
  },
  transpilePackages: [
    '@fullcalendar/common',
    '@fullcalendar/core',
    '@fullcalendar/daygrid',
    '@fullcalendar/timegrid',
    '@fullcalendar/list',
    '@fullcalendar/interaction',
    '@fullcalendar/react'
  ],
  async rewrites() {
    const targetUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000/api/v1'
    return [
      {
        source: '/api/v1/:path*',
        destination: `${targetUrl}/:path*`,
      },
      // Hierarchical Company + Branch scoped routing
      {
        source: '/:company/:branch/feature/:path*',
        destination: '/feature/:path*',
      },
      // Company scoped routing
      {
        source: '/:company/feature/:path*',
        destination: '/feature/:path*',
      },
    ];
  },
};

export default nextConfig;
