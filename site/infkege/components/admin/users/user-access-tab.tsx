"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { UsersClient, UserAccess } from "@/lib/services/users.client";
import { GrantAccessForm } from "./grant-access-form";

interface UserAccessTabProps {
  userId: string;
  access: UserAccess[];
  onUpdate: () => void;
}

export function UserAccessTab({ userId, access, onUpdate }: UserAccessTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [revoking, setRevoking] = useState<number | null>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleRevoke = async (accessId: number) => {
    if (!confirm("Отозвать доступ?")) return;
    setRevoking(accessId);
    try {
      await UsersClient.revokeAccess(userId, accessId);
      onUpdate();
    } catch (err) {
      console.error("Failed to revoke:", err);
    } finally {
      setRevoking(null);
    }
  };

  const handleGrantSuccess = () => {
    setShowForm(false);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      {/* Add Button */}
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[--color-border-main] rounded-lg text-sm text-[--color-text-secondary] hover:border-[--color-action] hover:text-[--color-action] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Выдать доступ
        </button>
      )}

      {/* Grant Form */}
      {showForm && (
        <GrantAccessForm
          userId={userId}
          onSuccess={handleGrantSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Access List */}
      {access.length === 0 ? (
        <p className="text-center text-sm text-[--color-text-secondary] py-8">Нет доступов</p>
      ) : (
        <div className="space-y-2">
          {access.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-[--color-bg-secondary] rounded-lg"
            >
              <div>
                <div className="text-sm font-medium text-[--color-text-primary]">
                  {item.productTitle || item.courseId}
                </div>
                <div className="text-xs text-[--color-text-secondary]">
                  {formatDate(item.grantedAt)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(item.id)}
                disabled={revoking === item.id}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
