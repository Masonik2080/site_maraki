"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Check } from "lucide-react";
import { UsersClient, ProductOption } from "@/lib/services/users.client";
import { cn } from "@/lib/utils";

interface GrantAccessFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function GrantAccessForm({ userId, onSuccess, onCancel }: GrantAccessFormProps) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await UsersClient.getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProduct) return;

    // courseId всегда должен быть slug курса, не пакета!
    const courseId = selectedProduct.slug || selectedProduct.id;
    const selectedPkg = selectedProduct.packages?.find((p) => p.id === selectedPackage);
    const title = selectedPkg ? `${selectedProduct.title}: ${selectedPkg.title}` : selectedProduct.title;

    setSaving(true);
    try {
      await UsersClient.grantAccess(userId, courseId, {
        productTitle: title,
        packageId: selectedPackage || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error("Failed to grant access:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-[--color-bg-secondary] rounded-lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-[--color-action]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[--color-bg-secondary] rounded-lg space-y-4">
      {/* Course List */}
      <div>
        <div className="text-xs font-medium text-[--color-text-secondary] uppercase mb-2">
          Выберите курс
        </div>
        <div className="space-y-2 max-h-[180px] overflow-auto">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => {
                setSelectedProduct(product);
                setSelectedPackage(null);
              }}
              className={cn(
                "w-full text-left p-3 rounded-lg border-2 transition-all",
                selectedProduct?.id === product.id
                  ? "border-[--color-action] bg-[--color-action]/5"
                  : "border-transparent bg-[--color-page-bg] hover:border-[--color-border-main]"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[--color-text-primary]">
                  {product.title}
                </span>
                {selectedProduct?.id === product.id && (
                  <Check className="w-4 h-4 text-[--color-action]" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Package Selection */}
      {selectedProduct?.packages && selectedProduct.packages.length > 0 && (
        <div>
          <div className="text-xs font-medium text-[--color-text-secondary] uppercase mb-2">
            Пакет (опционально)
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedPackage(null)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-full border transition-all",
                selectedPackage === null
                  ? "border-[--color-action] bg-[--color-action] text-white"
                  : "border-[--color-border-main] hover:border-[--color-action]"
              )}
            >
              Весь курс
            </button>
            {selectedProduct.packages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPackage(pkg.id)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-full border transition-all",
                  selectedPackage === pkg.id
                    ? "border-[--color-action] bg-[--color-action] text-white"
                    : "border-[--color-border-main] hover:border-[--color-action]"
                )}
              >
                {pkg.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm border border-[--color-border-main] rounded-lg hover:bg-[--color-page-bg]"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !selectedProduct}
          className="flex-1 py-2.5 text-sm bg-[--color-action] text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Выдать
        </button>
      </div>
    </div>
  );
}
