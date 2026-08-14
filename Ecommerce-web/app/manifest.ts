import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Saampark Group | Technology & Consultancy',
    short_name: 'Saampark',
    description:
      'ISO 9001:2015 certified Saampark Group offers website development, mobile app development, digital marketing, Meta Ads, Google Ads, and business legal services.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0D1B2A',
    theme_color: '#0D1B2A',
    icons: [
      {
        src: '/assets/logos/logo-main.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/assets/logos/logo-main.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
