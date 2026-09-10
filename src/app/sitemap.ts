import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.paireva.fun';

  let companionUrls: MetadataRoute.Sitemap = [];
  try {
    const companions = await prisma.companionProfile.findMany({
      where: { verificationStatus: 'VERIFIED' },
      select: { username: true, updatedAt: true },
    });

    companionUrls = companions.map((c) => ({
      url: `${baseUrl}/companions/${c.username}`,
      lastModified: c.updatedAt,
    }));
  } catch (error) {
    // Graceful fallback if database is offline during build step
  }

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/companions`, lastModified: new Date() },
    { url: `${baseUrl}/safety`, lastModified: new Date() },
    { url: `${baseUrl}/prohibited-services`, lastModified: new Date() },
    { url: `${baseUrl}/terms`, lastModified: new Date() },
    { url: `${baseUrl}/privacy`, lastModified: new Date() },
    { url: `${baseUrl}/refund-policy`, lastModified: new Date() },
    { url: `${baseUrl}/cancellation-policy`, lastModified: new Date() },
    { url: `${baseUrl}/community-guidelines`, lastModified: new Date() },
    ...companionUrls,
  ];
}
