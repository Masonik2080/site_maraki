"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";

interface PurchasePackage {
  id: string;
  title: string;
  description: string;
  price: number;
}

interface BulkPurchase {
  title: string;
  price: number;
  description: string;
  originalPrice?: number;
}

interface PurchaseOptions {
  type: string;
  packages?: PurchasePackage[];
  bulkPurchase?: BulkPurchase;
}

interface CourseData {
  id: string;
  slug: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number | null;
  isPublic?: boolean;
  isPreorder?: boolean;
  thumbnailUrl?: string;
  subtitle?: string;
  purchaseOptions?: PurchaseOptions;
  features?: { text: string }[];
}

interface EditCourseModalProps {
  open: boolean;
  course: CourseData | null;
  onClose: () => void;
  onSave: () => void;
}

export function EditCourseModal({ open, course, onClose, onSave }: EditCourseModalProps) {
  const [form, setForm] = useState<CourseData | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    if (course) {
      setForm({ ...course });
    }
  }, [course]);

  if (!open || !form) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      onSave();
      onClose();
    } catch {
      alert("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof CourseData>(field: K, value: CourseData[K]) => {
    setForm({ ...form, [field]: value });
  };

  const updatePackagePrice = (idx: number, price: number) => {
    if (!form.purchaseOptions?.packages) return;
    const packages = [...form.purchaseOptions.packages];
    packages[idx] = { ...packages[idx], price };
    setForm({
      ...form,
      purchaseOptions: { ...form.purchaseOptions, packages },
    });
  };

  const updateBulkField = (field: "price" | "originalPrice", value: number | null) => {
    if (!form.purchaseOptions?.bulkPurchase) return;
    setForm({
      ...form,
      purchaseOptions: {
        ...form.purchaseOptions,
        bulkPurchase: { ...form.purchaseOptions.bulkPurchase, [field]: value },
      },
    });
  };

  const updateFeature = (idx: number, text: string) => {
    const features = [...(form.features || [])];
    features[idx] = { text };
    setForm({ ...form, features });
  };

  const addFeature = () => {
    setForm({ ...form, features: [...(form.features || []), { text: "" }] });
  };

  const removeFeature = (idx: number) => {
    const features = [...(form.features || [])];
    features.splice(idx, 1);
    setForm({ ...form, features });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 modal-backdrop" onClick={onClose} />
      <div className="relative modal-content rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[--color-border-main]">
          <h2 className="text-sm font-semibold text-[--color-text-primary]">Редактирование курса</h2>
          <button onClick={onClose} className="p-1 text-[--color-text-secondary] hover:text-[--color-text-primary]">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-[--color-text-secondary] block mb-1.5">
              Название
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[--color-page-bg] border border-[--color-border-main] rounded-lg focus:outline-none focus:border-[--color-action]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-[--color-text-secondary] block mb-1.5">
              Описание
            </label>
            <textarea
              value={form.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-[--color-page-bg] border border-[--color-border-main] rounded-lg focus:outline-none focus:border-[--color-action] resize-none"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="text-xs font-medium text-[--color-text-secondary] block mb-1.5">
              Подзаголовок (бейдж)
            </label>
            <input
              type="text"
              value={form.subtitle || ""}
              onChange={(e) => updateField("subtitle", e.target.value)}
              placeholder="Новый курс"
              className="w-full px-3 py-2 text-sm bg-[--color-page-bg] border border-[--color-border-main] rounded-lg focus:outline-none focus:border-[--color-action]"
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[--color-text-secondary] block mb-1.5">
                Цена (₽)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => updateField("price", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-[--color-page-bg] border border-[--color-border-main] rounded-lg focus:outline-none focus:border-[--color-action]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[--color-text-secondary] block mb-1.5">
                Старая цена (₽)
              </label>
              <input
                type="number"
                value={form.originalPrice || ""}
                onChange={(e) => updateField("originalPrice", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="—"
                className="w-full px-3 py-2 text-sm bg-[--color-page-bg] border border-[--color-border-main] rounded-lg focus:outline-none focus:border-[--color-action]"
              />
            </div>
          </div>

          {/* Thumbnail */}
          <div>
            <label className="text-xs font-medium text-[--color-text-secondary] block mb-1.5">
              URL обложки
            </label>
            <input
              type="text"
              value={form.thumbnailUrl || ""}
              onChange={(e) => updateField("thumbnailUrl", e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm bg-[--color-page-bg] border border-[--color-border-main] rounded-lg focus:outline-none focus:border-[--color-action]"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => updateField("isPublic", !form.isPublic)}
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  form.isPublic !== false ? "bg-emerald-500" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    form.isPublic !== false ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </button>
              <span className="text-xs text-[--color-text-secondary] flex items-center gap-1">
                {form.isPublic !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                {form.isPublic !== false ? "Виден" : "Скрыт"}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => updateField("isPreorder", !form.isPreorder)}
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  form.isPreorder ? "bg-amber-500" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    form.isPreorder ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </button>
              <span className="text-xs text-[--color-text-secondary]">Предзаказ</span>
            </label>
          </div>

          {/* Packages (collapsible) */}
          {form.purchaseOptions?.packages && (
            <div className="border border-[--color-border-main] rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPackages(!showPackages)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-[--color-page-bg] text-xs font-medium text-[--color-text-secondary] hover:text-[--color-text-primary]"
              >
                <span>Пакеты ({form.purchaseOptions.packages.length})</span>
                {showPackages ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showPackages && (
                <div className="p-3 space-y-2 border-t border-[--color-border-main]">
                  {form.purchaseOptions.packages.map((pkg, idx) => (
                    <div key={pkg.id} className="flex items-center gap-3">
                      <span className="text-xs text-[--color-text-secondary] flex-1 truncate">{pkg.title}</span>
                      <input
                        type="number"
                        value={pkg.price}
                        onChange={(e) => updatePackagePrice(idx, parseInt(e.target.value) || 0)}
                        className="w-24 px-2 py-1.5 text-xs bg-[--color-page-bg] border border-[--color-border-main] rounded focus:outline-none focus:border-[--color-action]"
                      />
                    </div>
                  ))}
                  {form.purchaseOptions.bulkPurchase && (
                    <div className="pt-2 mt-2 border-t border-[--color-border-main] space-y-2">
                      <div className="text-[10px] font-bold text-[--color-text-secondary] uppercase">Оптом</div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[--color-text-secondary] flex-1">{form.purchaseOptions.bulkPurchase.title}</span>
                        <input
                          type="number"
                          value={form.purchaseOptions.bulkPurchase.price}
                          onChange={(e) => updateBulkField("price", parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1.5 text-xs bg-[--color-page-bg] border border-[--color-border-main] rounded focus:outline-none focus:border-[--color-action]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Features (collapsible) */}
          <div className="border border-[--color-border-main] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowFeatures(!showFeatures)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-[--color-page-bg] text-xs font-medium text-[--color-text-secondary] hover:text-[--color-text-primary]"
            >
              <span>Преимущества ({form.features?.length || 0})</span>
              {showFeatures ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showFeatures && (
              <div className="p-3 space-y-2 border-t border-[--color-border-main]">
                {form.features?.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={f.text}
                      onChange={(e) => updateFeature(idx, e.target.value)}
                      className="flex-1 px-2 py-1.5 text-xs bg-[--color-page-bg] border border-[--color-border-main] rounded focus:outline-none focus:border-[--color-action]"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(idx)}
                      className="p-1 text-red-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-xs text-[--color-action] hover:underline"
                >
                  + Добавить
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[--color-border-main]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md bg-[--color-action] text-[--color-action-text] hover:bg-[--color-action-hover] transition-all disabled:opacity-50"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
