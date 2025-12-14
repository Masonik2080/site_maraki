import { MetadataRoute } from "next";

export default async function robots(): Promise<MetadataRoute.Robots> {
  // В продакшене можно загружать из БД
  // const settings = await fetch('/api/admin/settings/seo').then(r => r.json());
  
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/dashboard/", "/checkout/"],
      },
    ],
    sitemap: "https://infkege.ru/sitemap.xml",
  };
}
