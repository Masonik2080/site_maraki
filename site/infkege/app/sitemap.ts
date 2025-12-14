import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://infkege.ru";
  
  // Статические страницы
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/legal`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
  
  // Динамические страницы курсов можно добавить из БД
  // const courses = await fetch('/api/products').then(r => r.json());
  // const coursePages = courses.map(course => ({
  //   url: `${baseUrl}/shop/${course.slug}`,
  //   lastModified: new Date(course.updated_at),
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.8,
  // }));
  
  return [...staticPages];
}
