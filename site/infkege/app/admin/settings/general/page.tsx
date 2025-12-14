"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Check, Globe, Mail, Phone, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GeneralSettings {
  siteName: string;
  siteUrl: string;
  siteEmail: string;
  sitePhone: string;
  siteAddress: string;
  timezone: string;
  language: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  copyrightText: string;
  supportEmail: string;
}

const TIMEZONES = [
  { value: "Europe/Moscow", label: "Москва (UTC+3)" },
  { value: "Europe/Kaliningrad", label: "Калининград (UTC+2)" },
  { value: "Europe/Samara", label: "Самара (UTC+4)" },
  { value: "Asia/Yekaterinburg", label: "Екатеринбург (UTC+5)" },
  { value: "Asia/Omsk", label: "Омск (UTC+6)" },
  { value: "Asia/Krasnoyarsk", label: "Красноярск (UTC+7)" },
  { value: "Asia/Irkutsk", label: "Иркутск (UTC+8)" },
  { value: "Asia/Yakutsk", label: "Якутск (UTC+9)" },
  { value: "Asia/Vladivostok", label: "Владивосток (UTC+10)" },
];

const LANGUAGES = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<GeneralSettings>({
    siteName: "INFKEGE",
    siteUrl: "https://infkege.ru",
    siteEmail: "info@infkege.ru",
    sitePhone: "",
    siteAddress: "",
    timezone: "Europe/Moscow",
    language: "ru",
    currency: "RUB",
    dateFormat: "DD.MM.YYYY",
    timeFormat: "HH:mm",
    maintenanceMode: false,
    maintenanceMessage: "Сайт временно недоступен. Ведутся технические работы.",
    copyrightText: "© 2024 INFKEGE. Все права защищены.",
    supportEmail: "support@infkege.ru",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"site" | "contact" | "regional" | "maintenance">("site");

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/general", {
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
    fetch("/api/admin/settings/general")
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
          <h1 className="text-sm font-semibold text-[--color-text-primary]">Общие настройки</h1>
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
              { id: "site", label: "Сайт", icon: Globe },
              { id: "contact", label: "Контакты", icon: Mail },
              { id: "regional", label: "Региональные", icon: Clock },
              { id: "maintenance", label: "Обслуживание", icon: () => <span>🔧</span> },
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

          {/* Site Tab */}
          {activeTab === "site" && (
            <div className="space-y-4">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Основная информация
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
                      URL сайта
                    </label>
                    <Input
                      value={settings.siteUrl}
                      onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                      placeholder="https://infkege.ru"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Копирайт
                    </label>
                    <Input
                      value={settings.copyrightText}
                      onChange={(e) => setSettings({ ...settings, copyrightText: e.target.value })}
                      placeholder="© 2024 INFKEGE"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === "contact" && (
            <div className="space-y-4">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Контактная информация
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      <Mail size={12} className="inline mr-1" />
                      Email сайта
                    </label>
                    <Input
                      type="email"
                      value={settings.siteEmail}
                      onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })}
                      placeholder="info@infkege.ru"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      <Mail size={12} className="inline mr-1" />
                      Email поддержки
                    </label>
                    <Input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      placeholder="support@infkege.ru"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      <Phone size={12} className="inline mr-1" />
                      Телефон
                    </label>
                    <Input
                      type="tel"
                      value={settings.sitePhone}
                      onChange={(e) => setSettings({ ...settings, sitePhone: e.target.value })}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      <MapPin size={12} className="inline mr-1" />
                      Адрес
                    </label>
                    <textarea
                      value={settings.siteAddress}
                      onChange={(e) => setSettings({ ...settings, siteAddress: e.target.value })}
                      placeholder="г. Москва, ул. Примерная, д. 1"
                      rows={2}
                      className="flex w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] placeholder:text-[--color-text-secondary] outline-none focus:border-[--color-action] resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regional Tab */}
          {activeTab === "regional" && (
            <div className="space-y-4">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Региональные настройки
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                        Язык
                      </label>
                      <select
                        value={settings.language}
                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                        className="flex h-10 w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] outline-none focus:border-[--color-action]"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                        Валюта
                      </label>
                      <select
                        value={settings.currency}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                        className="flex h-10 w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] outline-none focus:border-[--color-action]"
                      >
                        <option value="RUB">₽ Рубль (RUB)</option>
                        <option value="USD">$ Доллар (USD)</option>
                        <option value="EUR">€ Евро (EUR)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                      Часовой пояс
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="flex h-10 w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] outline-none focus:border-[--color-action]"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                        Формат даты
                      </label>
                      <select
                        value={settings.dateFormat}
                        onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                        className="flex h-10 w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] outline-none focus:border-[--color-action]"
                      >
                        <option value="DD.MM.YYYY">31.12.2024</option>
                        <option value="MM/DD/YYYY">12/31/2024</option>
                        <option value="YYYY-MM-DD">2024-12-31</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                        Формат времени
                      </label>
                      <select
                        value={settings.timeFormat}
                        onChange={(e) => setSettings({ ...settings, timeFormat: e.target.value })}
                        className="flex h-10 w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] outline-none focus:border-[--color-action]"
                      >
                        <option value="HH:mm">24-часовой (14:30)</option>
                        <option value="hh:mm A">12-часовой (2:30 PM)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === "maintenance" && (
            <div className="space-y-4">
              <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-5">
                <h3 className="text-sm font-medium text-[--color-text-primary] mb-4">
                  Режим обслуживания
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) =>
                        setSettings({ ...settings, maintenanceMode: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-[--color-border-main] text-[--color-action] focus:ring-[--color-action]"
                    />
                    <div>
                      <span className="text-sm text-[--color-text-primary]">
                        Включить режим обслуживания
                      </span>
                      <p className="text-xs text-[--color-text-secondary]">
                        Сайт будет недоступен для посетителей
                      </p>
                    </div>
                  </label>

                  {settings.maintenanceMode && (
                    <div className="pt-4 border-t border-[--color-border-main]">
                      <label className="block text-xs font-medium text-[--color-text-secondary] mb-1.5">
                        Сообщение для посетителей
                      </label>
                      <textarea
                        value={settings.maintenanceMessage}
                        onChange={(e) =>
                          setSettings({ ...settings, maintenanceMessage: e.target.value })
                        }
                        placeholder="Сайт временно недоступен..."
                        rows={3}
                        className="flex w-full rounded-md px-3 py-2 text-[14px] bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary] placeholder:text-[--color-text-secondary] outline-none focus:border-[--color-action] resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {settings.maintenanceMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 font-medium mb-1">
                    ⚠️ Режим обслуживания активен
                  </p>
                  <p className="text-xs text-amber-700">
                    Посетители сайта видят страницу с сообщением об обслуживании.
                    Администраторы могут продолжать работу.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
