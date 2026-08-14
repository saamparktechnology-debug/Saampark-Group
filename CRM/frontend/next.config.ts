import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://saampark-srm.onrender.com/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
