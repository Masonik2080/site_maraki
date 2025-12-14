"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { UsersTable, UserDetailPanel } from "@/components/admin/users";

export default function AdminUsersPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleClosePanel = () => {
    setSelectedUserId(null);
  };

  const handleUpdate = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 px-6 flex items-center border-b border-[--color-border-main] bg-[--color-bg-secondary]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[--color-action]" />
          <h1 className="text-sm font-semibold text-[--color-text-primary]">
            Пользователи
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0" key={refreshKey}>
          <UsersTable onSelectUser={handleSelectUser} />
        </div>

        {selectedUserId && (
          <UserDetailPanel
            userId={selectedUserId}
            onClose={handleClosePanel}
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </div>
  );
}
