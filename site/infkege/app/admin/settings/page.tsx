"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings,
  Search,
  Share2,
  Palette,
  BarChart2,
  Globe,
  FileText,
  Hash,
  Image,
  ChevronRight,
} from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    id: "seo",
    title: "SEO",
    description: "Robots.txt, sitemap, мета-теги",
    icon: Search,
    href: "/admin/settings/seo",
  },
  {
    id: "smm",
    title: "SMM & Соцсети",
    description: "Open Graph, Twitter Cards, хештеги",
    icon: Share2,
    href: "/admin/settings/smm",
  },
  {
    id: "branding",
    title: "Брендинг",
    description: "Favicon, логотип, цвета",
    icon: Palette,
    href: "/admin/settings/branding",
  },
  {
    id: "analytics",
    title: "Аналитика",
    description: "Google Analytics, Яндекс.Метрика",
    icon: BarChart2,
    href: "/admin/settings/analytics",
  },
  {
    id: "general",
    title: "Общие",
    description: "Название сайта, контакты, язык",
    icon: Globe,
    href: "/admin/settings/general",
  },
];

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-12 px-6 flex items-center border-b border-[--color-border-main]">
        <h1 className="text-sm font-semibold text-[--color-text-primary]">Настройки</h1>
      </header>

      <div className="p-6">
        <div className="max-w-3xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[--color-text-primary] mb-1">
              Настройки платформы
            </h2>
            <p className="text-sm text-[--color-text-secondary]">
              Управление SEO, SMM, брендингом и аналитикой сайта
            </p>
          </div>

          <div className="space-y-2">
            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className="flex items-center gap-4 p-4 bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg hover:border-[--color-action]/30 transition-all group"
                >
                  <div className="p-2.5 bg-[--color-action]/10 rounded-lg text-[--color-action]">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[--color-text-primary]">
                      {section.title}
                    </h3>
                    <p className="text-xs text-[--color-text-secondary]">
                      {section.description}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-[--color-text-secondary] group-hover:text-[--color-action] transition-colors"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
