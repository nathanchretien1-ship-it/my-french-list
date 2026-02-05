import { MetadataRoute } from 'next';
import { createClient } from './lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://votre-domaine.com'; // À modifier par ton vrai domaine
  const supabase = await createClient();

  // On récupère les IDs uniques de ta table library pour générer les pages de détails
  const { data: items } = await supabase
    .from('library')
    .select('jikan_id, type');

  const dynamicEntries = (items || []).map((item) => ({
    url: `${baseUrl}/${item.type === 'manga' ? 'manga' : 'anime'}/${item.jikan_id}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const staticRoutes = [
    '',
    '/season',
    '/season/upcoming',
    '/search',
    '/gacha',
    '/friends',
    '/messages',
    '/auth',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return [...staticRoutes, ...dynamicEntries];
}