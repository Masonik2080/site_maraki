"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Check, Hash, Image, Share2, Twitter, Facebook, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SmmSettings {
  // Open Graph
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  ogLocale: string;
  // Twitter
  twitterCard: string;
  twitterSite: string;
  twitterCreator: string;
  twitterImage: string;
  // Хештеги
  defaultHashtags: string;
  courseHashtags: string;
  // Соцсети
  vkGroup: string;
  telegramChannel: string;
  youtubeChannel: string;
  // Шаринг
  shareButtons: string[];
}

export default function SmmSettingsPage() {
  const [settings, setSettings] = useState<SmmSettings>({
    ogTitle: "INFKEGE - Подготовка к ЕГЭ по информатике",
    ogDescription: "Онлайн-курсы и материалы для подготовки к ЕГЭ по информатике",
    ogImage: "/og-image.png",
    ogType: "website",
    ogLocale: "ru_RU",
    twitterCard: "summary_large_image",
    twitterSite: "@infkege",
    twitterCreator: "@infkege",
    twitterImage: "/twitter-image.png",
    defaultHashtags: "#ЕГЭ #информатика #подготовка #infkege",
    courseHashtags: "#курс #обучение #онлайн",
    vkGroup: "",
    telegramChannel: "",
    youtubeChannel: "",
    shareButtons: ["vk", "telegram", "twitter"],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"og" | "twitter" | "hashtags" | "social">("og");

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/smm", {
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
    fetch("/api/admin/settings/smm")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setSettings((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {});
  }, []);

  const toggleShareButton = (btn: string) => {
    setSettings((prev) => ({
      ...prev,
      shareButtons: prev.shareButtons.includes(btn)
        ? prev.shareButtons.filter((b) => b !== btn)
        : [...prev.shareButtons, btn],
    }));
  };

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
          <h1 className="text-sm font-semibold text-[--color-text-primary]">SMM & Соцсети</h1>
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
              { id: "og", label: "Open Graph", icon: Share2 },
              { id: "twitter", label: "Twitter Cards", icon: Twitter },
              { id: "hashtags", label: "Хештеги", icon: Hash },
              { id: "social", label: "Соцсети", icon: MessageCircle },
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

          {/* Open Graph Tab */}
          {activeTab === "og" && (
            <div className="space-y-4">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Open Graph мета-теги
                </h3>
                <p className="text-xs text-[--color-text-secondary] mb-4">
                  Используются при шаринге в VK, Facebook, Telegram и других соцсетях
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      og:title
                    </label>
                    <Input
                      value={settings.ogTitle}
                      onChange={(e) => setSettings({ ...settings, ogTitle: e.target.value })}
                      placeholder="Заголовок для соцсетей"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      og:description
                    </label>
                    <textarea
                      value={settings.ogDescription}
                      onChange={(e) => setSettings({ ...settings, ogDescription: e.target.value })}
                      placeholder="Описание для соцсетей"
                      rows={3}
                      className="flex w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] placeholder:text-[--color-text-secondary] outline-none focus:border-[--color-action] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      og:image (URL изображения)
                    </label>
                    <Input
                      value={settings.ogImage}
                      onChange={(e) => setSettings({ ...settings, ogImage: e.target.value })}
                      placeholder="/og-image.png или https://..."
                    />
                    <p className="text-[10px] text-[--color-text-secondary] mt-1">
                      Рекомендуемый размер: 1200x630 пикселей
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                        og:type
                      </label>
                      <select
                        value={settings.ogType}
                        onChange={(e) => setSettings({ ...settings, ogType: e.target.value })}
                        className="flex h-10 w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] outline-none focus:border-[--color-action]"
                      >
                        <option value="website">website</option>
                        <option value="article">article</option>
                        <option value="product">product</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                        og:locale
                      </label>
                      <Input
                        value={settings.ogLocale}
                        onChange={(e) => setSettings({ ...settings, ogLocale: e.target.value })}
                        placeholder="ru_RU"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Предпросмотр
                </h3>
                <div className="border border-[--color-border-main] rounded-lg overflow-hidden max-w-sm">
                  <div className="h-40 bg-[--color-page-bg] flex items-center justify-center">
                    <Image size={32} className="text-[--color-text-secondary]/30" />
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-[--color-text-secondary] uppercase mb-1">
                      infkege.ru
                    </p>
                    <p className="text-sm font-medium text-[--color-text-primary] line-clamp-2">
                      {settings.ogTitle || "Заголовок"}
                    </p>
                    <p className="text-xs text-[--color-text-secondary] line-clamp-2 mt-1">
                      {settings.ogDescription || "Описание"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Twitter Cards Tab */}
          {activeTab === "twitter" && (
            <div className="space-y-4">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Twitter Cards
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Тип карточки
                    </label>
                    <select
                      value={settings.twitterCard}
                      onChange={(e) => setSettings({ ...settings, twitterCard: e.target.value })}
                      className="flex h-10 w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] outline-none focus:border-[--color-action]"
                    >
                      <option value="summary">Summary</option>
                      <option value="summary_large_image">Summary Large Image</option>
                      <option value="app">App</option>
                      <option value="player">Player</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      @username сайта
                    </label>
                    <Input
                      value={settings.twitterSite}
                      onChange={(e) => setSettings({ ...settings, twitterSite: e.target.value })}
                      placeholder="@infkege"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      @username автора
                    </label>
                    <Input
                      value={settings.twitterCreator}
                      onChange={(e) => setSettings({ ...settings, twitterCreator: e.target.value })}
                      placeholder="@infkege"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Изображение для Twitter
                    </label>
                    <Input
                      value={settings.twitterImage}
                      onChange={(e) => setSettings({ ...settings, twitterImage: e.target.value })}
                      placeholder="/twitter-image.png"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hashtags Tab */}
          {activeTab === "hashtags" && (
            <div className="space-y-4">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Хештеги по умолчанию
                </h3>
                <p className="text-xs text-[--color-text-secondary] mb-4">
                  Эти хештеги будут автоматически добавляться при шаринге контента
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Основные хештеги
                    </label>
                    <textarea
                      value={settings.defaultHashtags}
                      onChange={(e) => setSettings({ ...settings, defaultHashtags: e.target.value })}
                      placeholder="#хештег1 #хештег2"
                      rows={3}
                      className="flex w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] placeholder:text-[--color-text-secondary] outline-none focus:border-[--color-action] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Хештеги для курсов
                    </label>
                    <textarea
                      value={settings.courseHashtags}
                      onChange={(e) => setSettings({ ...settings, courseHashtags: e.target.value })}
                      placeholder="#курс #обучение"
                      rows={3}
                      className="flex w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] placeholder:text-[--color-text-secondary] outline-none focus:border-[--color-action] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-3">
                  Предпросмотр
                </h3>
                <div className="flex flex-wrap gap-2">
                  {settings.defaultHashtags.split(/\s+/).filter(Boolean).map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs bg-[--color-action]/10 text-[--color-action] rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Social Networks Tab */}
          {activeTab === "social" && (
            <div className="space-y-4">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Ссылки на соцсети
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      VK группа
                    </label>
                    <Input
                      value={settings.vkGroup}
                      onChange={(e) => setSettings({ ...settings, vkGroup: e.target.value })}
                      placeholder="https://vk.com/infkege"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Telegram канал
                    </label>
                    <Input
                      value={settings.telegramChannel}
                      onChange={(e) => setSettings({ ...settings, telegramChannel: e.target.value })}
                      placeholder="https://t.me/infkege"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      YouTube канал
                    </label>
                    <Input
                      value={settings.youtubeChannel}
                      onChange={(e) => setSettings({ ...settings, youtubeChannel: e.target.value })}
                      placeholder="https://youtube.com/@infkege"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Кнопки шаринга
                </h3>
                <p className="text-xs text-[--color-text-secondary] mb-4">
                  Выберите соцсети для кнопок "Поделиться"
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "vk", label: "VKontakte" },
                    { id: "telegram", label: "Telegram" },
                    { id: "twitter", label: "Twitter/X" },
                    { id: "whatsapp", label: "WhatsApp" },
                    { id: "viber", label: "Viber" },
                    { id: "ok", label: "Одноклассники" },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => toggleShareButton(btn.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                        settings.shareButtons.includes(btn.id)
                          ? "bg-[--color-action] text-white border-[--color-action]"
                          : "bg-[--color-page-bg] text-[--color-text-secondary] border-[--color-border-main] hover:border-[--color-action]"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
