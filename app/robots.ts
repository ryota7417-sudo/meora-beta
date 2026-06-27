import { MetadataRoute } from 'next';

const APP_URL = 'https://meora.aritude.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/auth/',
        '/chat/',
        '/dashboard/',
        '/onboarding/',
        '/purchase/',
        '/settings/',
        '/studio/',
        '/logs/',
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
