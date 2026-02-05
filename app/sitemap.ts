import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://myfrenchlist.fr'; // 👈 Remplace par ton vrai domaine

  // Si tu as des pages dynamiques (ex: des articles de blog depuis Supabase)
  // Tu peux les fetcher ici :
  // const posts = await fetchPostsFromSupabase();
  
  const routes = [
    '',
    '/anime',
    '/friends',
    '/auth',
    '/manga',
    '/messages',
    '/profile',
    '/search',
    '/season',
    '/season/upcoming',
    '/user',
    // Ajoute tes routes statiques ici
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return [...routes];
}