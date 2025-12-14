"use client";

import { useState } from "react";
import { Mail, Calendar, Wallet, Save, Loader2 } from "lucide-react";
import { UsersClient, UserProfile } from "@/lib/services/users.client";

interface UserInfoTabProps {
  user: UserProfile;
  onUpdate: () => void;
}

export function UserInfoTab({ user, onUpdate }: UserInfoTabProps) {
  const [saving, setSaving] = useState(false);
  const [editRole, setEditRole] = useState(user.role);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceType, setBalanceType] = useState<"add" | "subtract" | "set">("add");

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSaveRole = async () => {
    if (editRole === user.role) return;
    setSaving(true);
    try {
      await UsersClient.updateUser(user.userId, { role: editRole });
      onUpdate();
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBalance = async () => {
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) return;
    setSaving(true);
    try {
      await UsersClient.updateBalance(user.userId, amount, balanceType);
      setBalanceAmount("");
      onUpdate();
    } catch (err) {
      console.error("Failed to update balance:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="w-4 h-4 text-[--color-text-secondary]" />
          <span className="text-[--color-text-secondary]">{user.email || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-[--color-text-secondary]" />
          <span className="text-[--color-text-secondary]">
            Регистрация: {formatDate(user.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Wallet className="w-4 h-4 text-[--color-text-secondary]" />
          <span className="font-medium text-[--color-text-primary]">
            Баланс: {formatCurrency(user.balance)}
          </span>
        </div>
      </div>

      {/* Role */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[--color-text-primary]">Роль</label>
        <div className="flex gap-2">
          <select
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-[--color-border-main] rounded-lg bg-[--color-bg-secondary]"
          >
            <option value="user">Пользователь</option>
            <option value="admin">Администратор</option>
          </select>
          <button
            type="button"
            onClick={handleSaveRole}
            disabled={saving || editRole === user.role}
            className="px-3 py-2 bg-[--color-action] text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-1"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Balance */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[--color-text-primary]">Изменить баланс</label>
        <div className="flex gap-2">
          <select
            value={balanceType}
            onChange={(e) => setBalanceType(e.target.value as "add" | "subtract" | "set")}
            className="px-3 py-2 text-sm border border-[--color-border-main] rounded-lg bg-[--color-bg-secondary]"
          >
            <option value="add">Добавить</option>
            <option value="subtract">Списать</option>
            <option value="set">Установить</option>
          </select>
          <input
            type="number"
            value={balanceAmount}
            onChange={(e) => setBalanceAmount(e.target.value)}
            placeholder="Сумма"
            className="flex-1 px-3 py-2 text-sm border border-[--color-border-main] rounded-lg bg-[--color-bg-secondary]"
          />
          <button
            type="button"
            onClick={handleUpdateBalance}
            disabled={saving || !balanceAmount}
            className="px-3 py-2 bg-[--color-action] text-white rounded-lg text-sm disabled:opacity-50"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
