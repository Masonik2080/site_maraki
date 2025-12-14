"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Check, BarChart2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AnalyticsSettings {
  // Google
  googleAnalyticsId: string;
  googleTagManagerId: string;
  googleSearchConsoleVerification: string;
  // Yandex
  yandexMetrikaId: string;
  yandexWebmasterVerification: string;
  // Other
  facebookPixelId: string;
  vkPixelId: string;
  // Custom scripts
  headScripts: string;
  bodyScripts: string;
}

export default function AnalyticsSettingsPage() {
  const [settings, setSettings] = useState<AnalyticsSettings>({
    googleAnalyticsId: "",
    googleTagManagerId: "",
    googleSearchConsoleVerification: "",
    yandexMetrikaId: "",
    yandexWebmasterVerification: "",
    facebookPixelId: "",
    vkPixelId: "",
    headScripts: "",
    bodyScripts: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"google" | "yandex" | "pixels" | "custom">("google");

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/analytics", {
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
    fetch("/api/admin/settings/analytics")
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
          <h1 className="text-sm font-semibold text-[--color-text-primary]">Аналитика</h1>
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
              { id: "google", label: "Google" },
              { id: "yandex", label: "Яндекс" },
              { id: "pixels", label: "Пиксели" },
              { id: "custom", label: "Скрипты" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === tab.id
                    ? "bg-[--color-page-bg] text-[--color-text-primary] shadow-sm"
                    : "text-[--color-text-secondary] hover:text-[--color-text-primary]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Google Tab */}
          {activeTab === "google" && (
            <div className="space-y-4">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-[--color-text-primary]">
                    Google Analytics 4
                  </h3>
                  <a
                    href="https://analytics.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[--color-action] hover:underline flex items-center gap-1"
                  >
                    Открыть GA4 <ExternalLink size={12} />
                  </a>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Measurement ID (G-XXXXXXXXXX)
                    </label>
                    <Input
                      value={settings.googleAnalyticsId}
                      onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-[--color-text-primary]">
                    Google Tag Manager
                  </h3>
                  <a
                    href="https://tagmanager.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[--color-action] hover:underline flex items-center gap-1"
                  >
                    Открыть GTM <ExternalLink size={12} />
                  </a>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                    Container ID (GTM-XXXXXXX)
                  </label>
                  <Input
                    value={settings.googleTagManagerId}
                    onChange={(e) => setSettings({ ...settings, googleTagManagerId: e.target.value })}
                    placeholder="GTM-XXXXXXX"
                  />
                </div>
              </div>

              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-[--color-text-primary]">
                    Google Search Console
                  </h3>
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[--color-action] hover:underline flex items-center gap-1"
                  >
                    Открыть GSC <ExternalLink size={12} />
                  </a>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                    Код верификации
                  </label>
                  <Input
                    value={settings.googleSearchConsoleVerification}
                    onChange={(e) =>
                      setSettings({ ...settings, googleSearchConsoleVerification: e.target.value })
                    }
                    placeholder="google-site-verification=..."
                  />
                  <p className="text-[10px] text-[--color-text-secondary] mt-1">
                    Только значение content из мета-тега верификации
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Yandex Tab */}
          {activeTab === "yandex" && (
            <div className="space-y-4">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-[--color-text-primary]">
                    Яндекс.Метрика
                  </h3>
                  <a
                    href="https://metrika.yandex.ru/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[--color-action] hover:underline flex items-center gap-1"
                  >
                    Открыть Метрику <ExternalLink size={12} />
                  </a>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                    ID счётчика
                  </label>
                  <Input
                    value={settings.yandexMetrikaId}
                    onChange={(e) => setSettings({ ...settings, yandexMetrikaId: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
              </div>

              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-[--color-text-primary]">
                    Яндекс.Вебмастер
                  </h3>
                  <a
                    href="https://webmaster.yandex.ru/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[--color-action] hover:underline flex items-center gap-1"
                  >
                    Открыть Вебмастер <ExternalLink size={12} />
                  </a>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                    Код верификации
                  </label>
                  <Input
                    value={settings.yandexWebmasterVerification}
                    onChange={(e) =>
                      setSettings({ ...settings, yandexWebmasterVerification: e.target.value })
                    }
                    placeholder="yandex-verification=..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pixels Tab */}
          {activeTab === "pixels" && (
            <div className="space-y-4">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Facebook Pixel
                </h3>
                <div>
                  <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                    Pixel ID
                  </label>
                  <Input
                    value={settings.facebookPixelId}
                    onChange={(e) => setSettings({ ...settings, facebookPixelId: e.target.value })}
                    placeholder="123456789012345"
                  />
                </div>
              </div>

              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  VK Pixel
                </h3>
                <div>
                  <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                    Pixel ID
                  </label>
                  <Input
                    value={settings.vkPixelId}
                    onChange={(e) => setSettings({ ...settings, vkPixelId: e.target.value })}
                    placeholder="VK-RTRG-123456-xxxxx"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Custom Scripts Tab */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  Будьте осторожны с кастомными скриптами. Некорректный код может сломать сайт.
                </p>
              </div>

              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-2">
                  Скрипты в &lt;head&gt;
                </h3>
                <p className="text-xs text-[--color-text-secondary] mb-3">
                  Код будет добавлен перед закрывающим тегом &lt;/head&gt;
                </p>
                <textarea
                  value={settings.headScripts}
                  onChange={(e) => setSettings({ ...settings, headScripts: e.target.value })}
                  placeholder="<!-- Ваш код здесь -->"
                  rows={6}
                  className="flex w-full rounded-md px-3 py-2 text-[13px] font-mono bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] outline-none focus:border-[--color-action] resize-none"
                />
              </div>

              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-2">
                  Скрипты в &lt;body&gt;
                </h3>
                <p className="text-xs text-[--color-text-secondary] mb-3">
                  Код будет добавлен перед закрывающим тегом &lt;/body&gt;
                </p>
                <textarea
                  value={settings.bodyScripts}
                  onChange={(e) => setSettings({ ...settings, bodyScripts: e.target.value })}
                  placeholder="<!-- Ваш код здесь -->"
                  rows={6}
                  className="flex w-full rounded-md px-3 py-2 text-[13px] font-mono bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] outline-none focus:border-[--color-action] resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
