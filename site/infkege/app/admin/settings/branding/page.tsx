"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Check, Upload, Trash2, Palette, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BrandingSettings {
  siteName: string;
  siteTagline: string;
  favicon: string;
  logo: string;
  logoDark: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontPrimary: string;
  fontSecondary: string;
}

const PRESET_COLORS = [
  { name: "Синий", primary: "#1a1a2e", accent: "#3b82f6" },
  { name: "Зелёный", primary: "#1a2e1a", accent: "#22c55e" },
  { name: "Фиолетовый", primary: "#2e1a2e", accent: "#a855f7" },
  { name: "Оранжевый", primary: "#2e2a1a", accent: "#f97316" },
  { name: "Красный", primary: "#2e1a1a", accent: "#ef4444" },
];

const FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Nunito",
  "Poppins",
  "Source Sans Pro",
  "PT Sans",
];

export default function BrandingSettingsPage() {
  const [settings, setSettings] = useState<BrandingSettings>({
    siteName: "INFKEGE",
    siteTagline: "Подготовка к ЕГЭ по информатике",
    favicon: "/favicon.ico",
    logo: "/logo.png",
    logoDark: "/logo-dark.png",
    primaryColor: "#1a1a2e",
    secondaryColor: "#f4f4f5",
    accentColor: "#3b82f6",
    fontPrimary: "Inter",
    fontSecondary: "Inter",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"logo" | "colors" | "fonts">("logo");
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/branding", {
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
    fetch("/api/admin/settings/branding")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setSettings((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {});
  }, []);

  const handleFileUpload = async (file: File, type: "favicon" | "logo" | "logoDark") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await fetch("/api/admin/settings/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setSettings((prev) => ({ ...prev, [type]: data.url }));
      }
    } catch (e) {
      console.error(e);
    }
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
          <h1 className="text-sm font-semibold text-[--color-text-primary]">Брендинг</h1>
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
              { id: "logo", label: "Логотип и Favicon", icon: ImageIcon },
              { id: "colors", label: "Цвета", icon: Palette },
              { id: "fonts", label: "Шрифты", icon: () => <span className="text-sm font-bold">Aa</span> },
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

          {/* Logo Tab */}
          {activeTab === "logo" && (
            <div className="space-y-4">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Название и слоган
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Название сайта
                    </label>
                    <Input
                      value={settings.siteName}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      placeholder="INFKEGE"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Слоган
                    </label>
                    <Input
                      value={settings.siteTagline}
                      onChange={(e) => setSettings({ ...settings, siteTagline: e.target.value })}
                      placeholder="Подготовка к ЕГЭ"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Favicon
                </h3>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-[--color-page-bg] border border-[--color-border-main] rounded-lg flex items-center justify-center overflow-hidden">
                    {settings.favicon ? (
                      <img src={settings.favicon} alt="Favicon" className="w-8 h-8 object-contain" />
                    ) : (
                      <ImageIcon size={24} className="text-[--color-text-secondary]/30" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[--color-text-secondary] mb-3">
                      Рекомендуемый размер: 32x32 или 64x64 пикселей. Форматы: ICO, PNG, SVG
                    </p>
                    <div className="flex gap-2">
                      <input
                        ref={faviconInputRef}
                        type="file"
                        accept=".ico,.png,.svg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "favicon");
                        }}
                      />
                      <Button
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => faviconInputRef.current?.click()}
                      >
                        <Upload size={14} className="mr-1.5" />
                        Загрузить
                      </Button>
                      <Input
                        value={settings.favicon}
                        onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                        placeholder="/favicon.ico"
                        className="h-8 text-xs flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Логотип
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-2">
                      Светлая тема
                    </label>
                    <div className="h-24 bg-white border border-[--color-border-main] rounded-lg flex items-center justify-center mb-2">
                      {settings.logo ? (
                        <img src={settings.logo} alt="Logo" className="max-h-16 object-contain" />
                      ) : (
                        <span className="text-lg font-bold text-gray-900">{settings.siteName}</span>
                      )}
                    </div>
                    <Input
                      value={settings.logo}
                      onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                      placeholder="/logo.png"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-2">
                      Тёмная тема
                    </label>
                    <div className="h-24 bg-gray-900 border border-[--color-border-main] rounded-lg flex items-center justify-center mb-2">
                      {settings.logoDark ? (
                        <img src={settings.logoDark} alt="Logo Dark" className="max-h-16 object-contain" />
                      ) : (
                        <span className="text-lg font-bold text-white">{settings.siteName}</span>
                      )}
                    </div>
                    <Input
                      value={settings.logoDark}
                      onChange={(e) => setSettings({ ...settings, logoDark: e.target.value })}
                      placeholder="/logo-dark.png"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Colors Tab */}
          {activeTab === "colors" && (
            <div className="space-y-4">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Готовые темы
                </h3>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          primaryColor: preset.primary,
                          accentColor: preset.accent,
                        })
                      }
                      className="flex items-center gap-2 px-3 py-2 border border-[--color-border-main] rounded-lg hover:border-[--color-action] transition-all"
                    >
                      <div className="flex gap-1">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      <span className="text-xs text-[--color-text-primary]">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Кастомные цвета
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Основной цвет
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-md border border-[--color-border-main] cursor-pointer"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        className="h-10 text-xs flex-1 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Вторичный цвет
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                        className="w-10 h-10 rounded-md border border-[--color-border-main] cursor-pointer"
                      />
                      <Input
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                        className="h-10 text-xs flex-1 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Акцентный цвет
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                        className="w-10 h-10 rounded-md border border-[--color-border-main] cursor-pointer"
                      />
                      <Input
                        value={settings.accentColor}
                        onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                        className="h-10 text-xs flex-1 font-mono"
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
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: settings.secondaryColor }}
                >
                  <div
                    className="text-lg font-bold mb-2"
                    style={{ color: settings.primaryColor }}
                  >
                    {settings.siteName}
                  </div>
                  <p className="text-sm mb-3" style={{ color: settings.primaryColor + "99" }}>
                    {settings.siteTagline}
                  </p>
                  <button
                    className="px-4 py-2 rounded-md text-white text-sm font-medium"
                    style={{ backgroundColor: settings.accentColor }}
                  >
                    Кнопка действия
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fonts Tab */}
          {activeTab === "fonts" && (
            <div className="space-y-4">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Шрифты
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Основной шрифт
                    </label>
                    <select
                      value={settings.fontPrimary}
                      onChange={(e) => setSettings({ ...settings, fontPrimary: e.target.value })}
                      className="flex h-10 w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] outline-none focus:border-[--color-action]"
                    >
                      {FONTS.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Вторичный шрифт
                    </label>
                    <select
                      value={settings.fontSecondary}
                      onChange={(e) => setSettings({ ...settings, fontSecondary: e.target.value })}
                      className="flex h-10 w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] outline-none focus:border-[--color-action]"
                    >
                      {FONTS.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Font Preview */}
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Предпросмотр шрифтов
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[--color-text-secondary] mb-1">
                      Основной ({settings.fontPrimary})
                    </p>
                    <p
                      className="text-2xl text-[--color-text-primary]"
                      style={{ fontFamily: settings.fontPrimary }}
                    >
                      Быстрая коричневая лиса прыгает через ленивую собаку
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[--color-text-secondary] mb-1">
                      Вторичный ({settings.fontSecondary})
                    </p>
                    <p
                      className="text-lg text-[--color-text-secondary]"
                      style={{ fontFamily: settings.fontSecondary }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
