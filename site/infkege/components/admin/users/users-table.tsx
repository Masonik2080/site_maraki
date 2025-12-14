"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, User } from "lucide-react";
import { UsersClient, UserProfile, UsersListParams } from "@/lib/services/users.client";
import { cn } from "@/lib/utils";

interface UsersTableProps {
  onSelectUser: (userId: string) => void;
}

type SortField = "full_name" | "balance" | "created_at" | "email";

export function UsersTable({ onSelectUser }: UsersTableProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [roleFilter, setRoleFilter] = useState("");

  const limit = 15;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: UsersListParams = {
        page,
        limit,
        search: search || undefined,
        sortBy,
        sortOrder,
        role: roleFilter || undefined,
      };
      const result = await UsersClient.getUsers(params);
      setUsers(result.users);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(balance);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 border-b border-[--color-border-main] bg-[--color-bg-secondary]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-secondary]" />
          <input
            type="text"
            placeholder="Поиск по имени или username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[--color-border-main] rounded-lg bg-[--color-page-bg] focus:outline-none focus:ring-2 focus:ring-[--color-action]/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm border border-[--color-border-main] rounded-lg bg-[--color-page-bg] focus:outline-none"
        >
          <option value="">Все роли</option>
          <option value="user">Пользователь</option>
          <option value="admin">Админ</option>
        </select>
        <div className="text-sm text-[--color-text-secondary] flex items-center">
          Всего: {total}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-[--color-bg-secondary] sticky top-0">
            <tr className="border-b border-[--color-border-main]">
              <th className="text-left px-4 py-3 font-medium text-[--color-text-secondary]">
                <button
                  onClick={() => handleSort("full_name")}
                  className="flex items-center gap-1 hover:text-[--color-text-primary]"
                >
                  Пользователь <SortIcon field="full_name" />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium text-[--color-text-secondary]">
                <button
                  onClick={() => handleSort("email")}
                  className="flex items-center gap-1 hover:text-[--color-text-primary]"
                >
                  Email <SortIcon field="email" />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium text-[--color-text-secondary]">
                Роль
              </th>
              <th className="text-right px-4 py-3 font-medium text-[--color-text-secondary]">
                <button
                  onClick={() => handleSort("balance")}
                  className="flex items-center gap-1 ml-auto hover:text-[--color-text-primary]"
                >
                  Баланс <SortIcon field="balance" />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium text-[--color-text-secondary]">
                <button
                  onClick={() => handleSort("created_at")}
                  className="flex items-center gap-1 hover:text-[--color-text-primary]"
                >
                  Регистрация <SortIcon field="created_at" />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium text-[--color-text-secondary]">
                Последний вход
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[--color-text-secondary]">
                  Загрузка...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[--color-text-secondary]">
                  Пользователи не найдены
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => onSelectUser(user.userId)}
                  className="border-b border-[--color-border-main] hover:bg-[--color-bg-secondary] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[--color-action]/10 flex items-center justify-center flex-shrink-0">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-[--color-action]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-[--color-text-primary] truncate">
                          {user.fullName || "Без имени"}
                        </div>
                        {user.username && (
                          <div className="text-xs text-[--color-text-secondary] truncate">
                            @{user.username}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[--color-text-secondary] truncate max-w-[200px]">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs rounded-full",
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {user.role === "admin" ? "Админ" : "Пользователь"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[--color-text-primary]">
                    {formatBalance(user.balance)}
                  </td>
                  <td className="px-4 py-3 text-[--color-text-secondary]">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-[--color-text-secondary]">
                    {formatDate(user.lastSignIn)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[--color-border-main] bg-[--color-bg-secondary]">
          <div className="text-sm text-[--color-text-secondary]">
            Страница {page} из {totalPages}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded hover:bg-[--color-page-bg] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded hover:bg-[--color-page-bg] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
