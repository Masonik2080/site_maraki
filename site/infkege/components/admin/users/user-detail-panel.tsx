"use client";

import { useState, useEffect } from "react";
import { X, User, BookOpen, ShoppingBag, Loader2 } from "lucide-react";
import { UsersClient, UserProfile, UserAccess, UserOrder } from "@/lib/services/users.client";
import { cn } from "@/lib/utils";
import { UserInfoTab } from "./user-info-tab";
import { UserAccessTab } from "./user-access-tab";
import { UserOrdersTab } from "./user-orders-tab";

interface UserDetailPanelProps {
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}

type Tab = "info" | "access" | "orders";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "info", label: "Инфо", icon: User },
  { id: "access", label: "Доступы", icon: BookOpen },
  { id: "orders", label: "Заказы", icon: ShoppingBag },
];

export function UserDetailPanel({ userId, onClose, onUpdate }: UserDetailPanelProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [access, setAccess] = useState<UserAccess[]>([]);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const loadUser = async () => {
    setLoading(true);
    try {
      const data = await UsersClient.getUserDetails(userId);
      setUser(data.user);
      setAccess(data.access);
      setOrders(data.orders);
    } catch (err) {
      console.error("Failed to load user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [userId]);

  const handleUpdate = () => {
    loadUser();
    onUpdate();
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-[400px] border-l border-[--color-border-main] bg-[--color-page-bg] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[--color-action]" />
      </div>
    );
  }

  // Not found
  if (!user) {
    return (
      <div className="w-[400px] border-l border-[--color-border-main] bg-[--color-page-bg] flex items-center justify-center">
        <p className="text-[--color-text-secondary]">Пользователь не найден</p>
      </div>
    );
  }

  return (
    <div className="w-[400px] border-l border-[--color-border-main] bg-[--color-page-bg] flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[--color-border-main]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[--color-action]/10 flex items-center justify-center">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-[--color-action]" />
            )}
          </div>
          <div>
            <div className="font-medium text-[--color-text-primary]">
              {user.fullName || "Без имени"}
            </div>
            {user.username && (
              <div className="text-xs text-[--color-text-secondary]">@{user.username}</div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-[--color-bg-secondary] rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[--color-border-main]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "text-[--color-action] border-b-2 border-[--color-action]"
                : "text-[--color-text-secondary] hover:text-[--color-text-primary]"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "info" && <UserInfoTab user={user} onUpdate={handleUpdate} />}
        {activeTab === "access" && (
          <UserAccessTab userId={userId} access={access} onUpdate={handleUpdate} />
        )}
        {activeTab === "orders" && <UserOrdersTab orders={orders} />}
      </div>
    </div>
  );
}
