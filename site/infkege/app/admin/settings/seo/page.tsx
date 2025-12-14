"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, FileText, Map, Bot, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SeoSettings {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  robotsTxt: string;
  sitemapEnabled: boolean;
  sitemapChangefreq: string;
  sitemapPriority: string;
  canonicalUrl: string;
  indexingEnabled: boolean;
}

const DEFAULT_ROBOTS = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /checkout/

Sitemap: https://infkege.ru/sitemap.xml`;

export default function SeoSettingsPage() {
  const [settings, setSettings] = useState<SeoSettings>({
    siteTitle: "INFKEGE - Подготовка к ЕГЭ по информатике",
    siteDescription: "Онлайн-курсы и материалы для подготовки к ЕГЭ по информатике",
    siteKeywords: "ЕГЭ, информатика, подготовка, курсы, задания",
    robotsTxt: DEFAULT_ROBOTS,
    sitemapEnabled: true,
    sitemapChangefreq: "weekly",
    sitemapPriority: "0.8",
    canonicalUrl: "https://infkege.ru",
    indexingEnabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"meta" | "robots" | "sitemap">("meta");

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetch("/api/admin/settings/seo")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setSettings((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-12 px-6 flex items-center justify-between border-b border-[--color-border-main]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings"
            className="p-1.5 hover:bg-[--color-bg-secondary] rounded-md transition-colors"
          >
            <ArrowLeft size={16} className="text-[--color-text-secondary]" />
          </Link>
          <h1 className="text-sm font-semibold text-[--color-text-primary]">SEO настройки</h1>
        </div>
        <Button onClick={handleSave} disabled={saving} className="h-8 text-xs">
          {saved ? <Check size={14} className="mr-1.5" /> : <Save size={14} className="mr-1.5" />}
          {saved ? "Сохранено" : saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </header>

      <div className="p-6">
        <div className="max-w-3xl">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-[--color-bg-secondary] rounded-lg mb-6 w-fit">
            {[
              { id: "meta", label: "Мета-теги", icon: FileText },
              { id: "robots", label: "Robots.txt", icon: Bot },
              { id: "sitemap", label: "Sitemap", icon: Map },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeTab === tab.id
                      ? "bg-[--color-page-bg] text-[--color-text-primary] shadow-sm"
                      : "text-[--color-text-secondary] hover:text-[--color-text-primary]"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Meta Tags Tab */}
          {activeTab === "meta" && (
            <div className="space-y-6">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Основные мета-теги
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Заголовок сайта (title)
                    </label>
                    <Input
                      value={settings.siteTitle}
                      onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                      placeholder="Название вашего сайта"
                    />
                    <p className="text-[10px] text-[--color-text-secondary] mt-1">
                      {settings.siteTitle.length}/60 символов (рекомендуется до 60)
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Описание (description)
                    </label>
                    <textarea
                      value={settings.siteDescription}
                      onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                      placeholder="Краткое описание сайта"
                      rows={3}
                      className="flex w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] placeholder:text-[--color-text-secondary] outline-none focus:border-[--color-action] focus:ring-2 focus:ring-[--color-action] focus:ring-opacity-20 resize-none"
                    />
                    <p className="text-[10px] text-[--color-text-secondary] mt-1">
                      {settings.siteDescription.length}/160 символов (рекомендуется до 160)
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Ключевые слова (keywords)
                    </label>
                    <Input
                      value={settings.siteKeywords}
                      onChange={(e) => setSettings({ ...settings, siteKeywords: e.target.value })}
                      placeholder="ключевое1, ключевое2, ключевое3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Канонический URL
                    </label>
                    <Input
                      value={settings.canonicalUrl}
                      onChange={(e) => setSettings({ ...settings, canonicalUrl: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Индексация
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.indexingEnabled}
                    onChange={(e) => setSettings({ ...settings, indexingEnabled: e.target.checked })}
                    className="w-4 h-4 rounded border-[--color-border-main] text-[--color-action] focus:ring-[--color-action]"
                  />
                  <div>
                    <span className="text-sm text-[--color-text-primary]">
                      Разрешить индексацию сайта
                    </span>
                    <p className="text-xs text-[--color-text-secondary]">
                      Если выключено, добавится мета-тег noindex
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Robots.txt Tab */}
          {activeTab === "robots" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  Изменения в robots.txt влияют на индексацию сайта поисковыми системами.
                  Будьте осторожны с директивами Disallow.
                </p>
              </div>
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <label className="block text-xs font-medium text-[--color-text-secondary] mb-2">
                  Содержимое robots.txt
                </label>
                <textarea
                  value={settings.robotsTxt}
                  onChange={(e) => setSettings({ ...settings, robotsTxt: e.target.value })}
                  rows={12}
                  className="flex w-full rounded-md px-3 py-2 text-[13px] font-mono bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] outline-none focus:border-[--color-action] focus:ring-2 focus:ring-[--color-action] focus:ring-opacity-20 resize-none"
                />
              </div>
            </div>
          )}

          {/* Sitemap Tab */}
          {activeTab === "sitemap" && (
            <div className="space-y-4">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={settings.sitemapEnabled}
                    onChange={(e) => setSettings({ ...settings, sitemapEnabled: e.target.checked })}
                    className="w-4 h-4 rounded border-[--color-border-main] text-[--color-action] focus:ring-[--color-action]"
                  />
                  <span className="text-sm text-[--color-text-primary]">
                    Автоматическая генерация sitemap.xml
                  </span>
                </label>

                {settings.sitemapEnabled && (
                  <div className="space-y-4 pt-4 border-t border-[--color-border-main]">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                          Частота обновления
                        </label>
                        <select
                          value={settings.sitemapChangefreq}
                          onChange={(e) => setSettings({ ...settings, sitemapChangefreq: e.target.value })}
                          className="flex h-10 w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] outline-none focus:border-[--color-action]"
                        >
                          <option value="always">Постоянно</option>
                          <option value="hourly">Ежечасно</option>
                          <option value="daily">Ежедневно</option>
                          <option value="weekly">Еженедельно</option>
                          <option value="monthly">Ежемесячно</option>
                          <option value="yearly">Ежегодно</option>
                          <option value="never">Никогда</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                          Приоритет (0.0 - 1.0)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.sitemapPriority}
                          onChange={(e) => setSettings({ ...settings, sitemapPriority: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
