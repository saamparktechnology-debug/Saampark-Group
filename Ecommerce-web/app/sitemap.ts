import { MetadataRoute } from 'next';
import { SERVICE_CATEGORIES } from '@/lib/data/services';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.saampark.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // Division entity routes
  const entityRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/str`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/scs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // Category dynamic routes
  const categoryRoutes: MetadataRoute.Sitemap = SERVICE_CATEGORIES.map((cat) => ({
    url: `${baseUrl}/${cat.group}/${cat.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...entityRoutes, ...categoryRoutes];
}
