"use client";

import { useState, useEffect, useCallback, useOptimistic, memo } from "react";
import { RotateCcw, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, FileText, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOptimisticMutation } from "@/lib/hooks/use-optimistic-mutation";

// ============================================================================
// Types
// ============================================================================

interface RecoveryRequest {
  id: string;
  user_id: string;
  email: string;
  has_documents: boolean;
  selected_items: string[];
  comment: string | null;
  status: "pending" | "approved" | "rejected";
  admin_comment: string | null;
  granted_items: string[] | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface UpdateVariables {
  id: string;
  status: "approved" | "rejected";
  adminComment?: string;
  grantItems?: string[];
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG = {
  pending: { label: "В ожидании", icon: Clock, color: "bg-blue-100 text-blue-700" },
  approved: { label: "Одобрено", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Отклонено", icon: XCircle, color: "bg-red-100 text-red-700" },
} as const;

const ITEM_LABELS: Record<string, string> = {
  "sbornik-all": "Сборник (весь)",
  "pack-1": "Сборник: Пакет 1",
  "pack-2": "Сборник: Пакет 2",
  "pack-3": "Сборник: Пакет 3",
  "mt-course": "Экспресс-курс МТ",
  "fast-start": "Быстрый старт",
  "tutors": "Обучение репетиторов",
};

const ALL_GRANT_ITEMS = [
  { id: "sbornik-all", label: "Сборник (весь)", group: "Сборник" },
  { id: "pack-1", label: "Пакет 1 (Варианты 1-25)", group: "Сборник" },
  { id: "pack-2", label: "Пакет 2 (Варианты 26-40)", group: "Сборник" },
  { id: "pack-3", label: "Пакет 3 (Варианты 41-50)", group: "Сборник" },
  { id: "mt-course", label: "Экспресс-курс по МТ", group: "Курсы" },
  { id: "fast-start", label: "Быстрый старт", group: "Курсы" },
  { id: "tutors", label: "Обучение репетиторов", group: "Курсы" },
] as const;

const SBORNIK_PACKAGES = ["pack-1", "pack-2", "pack-3"];

// ============================================================================
// API Functions
// ============================================================================

async function fetchRecoveryRequests(params: { page: number; limit: number; status: string }) {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
    status: params.status,
  });
  const res = await fetch(`/api/admin/recovery?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function updateRecoveryRequest(variables: UpdateVariables): Promise<{ success: boolean; request: RecoveryRequest }> {
  const res = await fetch("/api/admin/recovery", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(variables),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================================
// Main Component
// ============================================================================

export default function AdminRecoveryPage() {
  const [requests, setRequests] = useState<RecoveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<RecoveryRequest | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // React 19 useOptimistic for instant UI updates
  const [optimisticRequests, updateOptimistic] = useOptimistic(
    requests,
    (state, update: { id: string; status: "approved" | "rejected"; grantItems?: string[]; adminComment?: string }) =>
      state.map((req) =>
        req.id === update.id
          ? {
              ...req,
              status: update.status,
              granted_items: update.grantItems || null,
              admin_comment: update.adminComment || null,
              reviewed_at: new Date().toISOString(),
            }
          : req
      )
  );

  // Optimistic mutation hook
  const { mutate: updateStatus, isPending: isUpdating } = useOptimisticMutation<
    { success: boolean; request: RecoveryRequest },
    UpdateVariables,
    { previousRequests: RecoveryRequest[]; previousSelected: RecoveryRequest | null }
  >({
    onMutate: (variables) => {
      // Save current state for rollback
      const previousRequests = requests;
      const previousSelected = selectedRequest;

      // Optimistic update via React 19 hook
      updateOptimistic({
        id: variables.id,
        status: variables.status,
        grantItems: variables.grantItems,
        adminComment: variables.adminComment,
      });

      // Close panel immediately for snappy UX
      setSelectedRequest(null);

      return { previousRequests, previousSelected };
    },

    mutationFn: updateRecoveryRequest,

    onSuccess: (data) => {
      // Sync with server response (authoritative)
      setRequests((prev) => prev.map((req) => (req.id === data.request.id ? data.request : req)));
      showToast("success", data.request.status === "approved" ? "Заявка одобрена" : "Заявка отклонена");
    },

    onError: (_error, _variables, context) => {
      // Rollback to previous state
      if (context) {
        setRequests(context.previousRequests);
        setSelectedRequest(context.previousSelected);
      }
      showToast("error", "Ошибка при обновлении заявки");
    },
  });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRecoveryRequests({ page, limit: 20, status: statusFilter });
      setRequests(data.requests || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch recovery requests:", err);
      showToast("error", "Ошибка загрузки заявок");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusChange = useCallback(
    (id: string, newStatus: "approved" | "rejected", adminComment?: string, grantItems?: string[]) => {
      updateStatus({ id, status: newStatus, adminComment, grantItems });
    },
    [updateStatus]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all",
            toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
          )}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="h-12 px-6 flex items-center border-b border-[--color-border-main] bg-[--color-bg-secondary]">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-[--color-action]" />
          <h1 className="text-sm font-semibold text-[--color-text-primary]">Восстановления</h1>
          {isUpdating && (
            <div className="ml-2 flex items-center gap-1 text-xs text-[--color-text-secondary]">
              <Loader2 className="w-3 h-3 animate-spin" />
              Сохранение...
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 border-b border-[--color-border-main] bg-[--color-bg-secondary]">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm border border-[--color-border-main] rounded-lg bg-[--color-page-bg] focus:outline-none"
        >
          <option value="all">Все статусы</option>
          <option value="pending">В ожидании</option>
          <option value="approved">Одобрено</option>
          <option value="rejected">Отклонено</option>
        </select>
        <div className="text-sm text-[--color-text-secondary] flex items-center">Всего: {total}</div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-[--color-bg-secondary] sticky top-0">
              <tr className="border-b border-[--color-border-main]">
                <th className="text-left px-4 py-3 font-medium text-[--color-text-secondary]">Email</th>
                <th className="text-left px-4 py-3 font-medium text-[--color-text-secondary]">Курсы</th>
                <th className="text-left px-4 py-3 font-medium text-[--color-text-secondary]">Документы</th>
                <th className="text-left px-4 py-3 font-medium text-[--color-text-secondary]">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-[--color-text-secondary]">Дата</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[--color-text-secondary]">
                    Загрузка...
                  </td>
                </tr>
              ) : optimisticRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[--color-text-secondary]">
                    Заявок не найдено
                  </td>
                </tr>
              ) : (
                optimisticRequests.map((req) => (
                  <RecoveryRow
                    key={req.id}
                    request={req}
                    isSelected={selectedRequest?.id === req.id}
                    onSelect={() => setSelectedRequest(req)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selectedRequest && (
          <DetailPanel
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onStatusChange={handleStatusChange}
            isUpdating={isUpdating}
          />
        )}
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

// ============================================================================
// Memoized Row Component — prevents re-render of unchanged rows
// ============================================================================

interface RecoveryRowProps {
  request: RecoveryRequest;
  isSelected: boolean;
  onSelect: () => void;
}

const RecoveryRow = memo(function RecoveryRow({ request, isSelected, onSelect }: RecoveryRowProps) {
  const statusCfg = STATUS_CONFIG[request.status];
  const StatusIcon = statusCfg.icon;

  return (
    <tr
      onClick={onSelect}
      className={cn(
        "border-b border-[--color-border-main] cursor-pointer transition-colors",
        isSelected ? "bg-[--color-action]/5" : "hover:bg-[--color-bg-secondary]"
      )}
    >
      <td className="px-4 py-3 text-[--color-text-primary]">{request.email}</td>
      <td className="px-4 py-3 text-[--color-text-secondary]">
        <div className="flex flex-wrap gap-1">
          {request.selected_items.slice(0, 2).map((item) => (
            <span key={item} className="px-1.5 py-0.5 text-xs bg-[--color-page-bg] rounded">
              {ITEM_LABELS[item] || item}
            </span>
          ))}
          {request.selected_items.length > 2 && (
            <span className="px-1.5 py-0.5 text-xs text-[--color-text-secondary]">
              +{request.selected_items.length - 2}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {request.has_documents ? (
          <FileText className="w-4 h-4 text-emerald-600" />
        ) : (
          <span className="text-[--color-text-secondary]">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full", statusCfg.color)}>
          <StatusIcon className="w-3 h-3" />
          {statusCfg.label}
        </span>
      </td>
      <td className="px-4 py-3 text-[--color-text-secondary]">{formatDate(request.created_at)}</td>
    </tr>
  );
});


// ============================================================================
// Detail Panel Component
// ============================================================================

interface DetailPanelProps {
  request: RecoveryRequest;
  onClose: () => void;
  onStatusChange: (id: string, status: "approved" | "rejected", comment?: string, grantItems?: string[]) => void;
  isUpdating: boolean;
}

function DetailPanel({ request, onClose, onStatusChange, isUpdating }: DetailPanelProps) {
  const [adminComment, setAdminComment] = useState(request.admin_comment || "");
  const [grantItems, setGrantItems] = useState<string[]>(request.selected_items);
  const statusCfg = STATUS_CONFIG[request.status];

  const toggleGrantItem = (item: string) => {
    setGrantItems((prev) => {
      const isSelected = prev.includes(item);
      if (isSelected) return prev.filter((i) => i !== item);
      if (item === "sbornik-all") return [...prev.filter((i) => !SBORNIK_PACKAGES.includes(i)), item];
      if (SBORNIK_PACKAGES.includes(item)) return [...prev.filter((i) => i !== "sbornik-all"), item];
      return [...prev, item];
    });
  };

  return (
    <div className="w-80 border-l border-[--color-border-main] bg-[--color-page-bg] flex flex-col">
      <div className="h-12 px-4 flex items-center justify-between border-b border-[--color-border-main]">
        <span className="text-sm font-medium text-[--color-text-primary]">Детали заявки</span>
        <button onClick={onClose} className="text-[--color-text-secondary] hover:text-[--color-text-primary]">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <div className="text-xs text-[--color-text-secondary] mb-1">Email</div>
          <div className="text-sm text-[--color-text-primary]">{request.email}</div>
        </div>

        <div>
          <div className="text-xs text-[--color-text-secondary] mb-1">Статус</div>
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full", statusCfg.color)}>
            {statusCfg.label}
          </span>
        </div>

        <div>
          <div className="text-xs text-[--color-text-secondary] mb-1">Документы</div>
          <div className="text-sm text-[--color-text-primary]">{request.has_documents ? "Есть" : "Нет"}</div>
        </div>

        <div>
          <div className="text-xs text-[--color-text-secondary] mb-1">Запросил пользователь</div>
          <div className="flex flex-wrap gap-1 mb-3">
            {request.selected_items.map((item) => (
              <span key={item} className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                {ITEM_LABELS[item] || item}
              </span>
            ))}
          </div>
        </div>

        {request.status === "pending" && (
          <div>
            <div className="text-xs text-[--color-text-secondary] mb-2">Выдать доступ к:</div>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-[--color-text-secondary] mb-1">Сборник</div>
                <div className="space-y-1">
                  {ALL_GRANT_ITEMS.filter((i) => i.group === "Сборник").map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-sm px-2 py-1 rounded cursor-pointer hover:bg-[--color-bg-secondary]">
                      <input type="checkbox" checked={grantItems.includes(item.id)} onChange={() => toggleGrantItem(item.id)} className="w-3.5 h-3.5 rounded" />
                      <span className={cn("text-[--color-text-primary]", !grantItems.includes(item.id) && "text-[--color-text-secondary]")}>{item.label}</span>
                      {request.selected_items.includes(item.id) && <span className="text-[10px] px-1 py-0.5 bg-blue-100 text-blue-600 rounded">запрошено</span>}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[--color-text-secondary] mb-1">Курсы</div>
                <div className="space-y-1">
                  {ALL_GRANT_ITEMS.filter((i) => i.group === "Курсы").map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-sm px-2 py-1 rounded cursor-pointer hover:bg-[--color-bg-secondary]">
                      <input type="checkbox" checked={grantItems.includes(item.id)} onChange={() => toggleGrantItem(item.id)} className="w-3.5 h-3.5 rounded" />
                      <span className={cn("text-[--color-text-primary]", !grantItems.includes(item.id) && "text-[--color-text-secondary]")}>{item.label}</span>
                      {request.selected_items.includes(item.id) && <span className="text-[10px] px-1 py-0.5 bg-blue-100 text-blue-600 rounded">запрошено</span>}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {grantItems.length === 0 && <div className="text-xs text-red-500 mt-2">Выберите хотя бы один курс</div>}
          </div>
        )}

        {request.status !== "pending" && request.granted_items && request.granted_items.length > 0 && (
          <div>
            <div className="text-xs text-[--color-text-secondary] mb-1">Выдано</div>
            <div className="space-y-1">
              {request.granted_items.map((item) => (
                <div key={item} className="text-sm text-emerald-700 px-2 py-1 bg-emerald-50 rounded">✓ {ITEM_LABELS[item] || item}</div>
              ))}
            </div>
          </div>
        )}

        {request.comment && (
          <div>
            <div className="text-xs text-[--color-text-secondary] mb-1">Комментарий пользователя</div>
            <div className="text-sm text-[--color-text-primary] p-2 bg-[--color-bg-secondary] rounded">{request.comment}</div>
          </div>
        )}

        <div>
          <div className="text-xs text-[--color-text-secondary] mb-1">Дата создания</div>
          <div className="text-sm text-[--color-text-primary]">{new Date(request.created_at).toLocaleString("ru-RU")}</div>
        </div>

        {request.status === "pending" && (
          <>
            <div>
              <div className="text-xs text-[--color-text-secondary] mb-1">Комментарий админа</div>
              <textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="Комментарий (опционально)..."
                className="w-full px-3 py-2 text-sm border border-[--color-border-main] rounded-lg bg-[--color-page-bg] resize-none h-20"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onStatusChange(request.id, "approved", adminComment, grantItems)}
                disabled={grantItems.length === 0 || isUpdating}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
                Одобрить ({grantItems.length})
              </button>
              <button
                onClick={() => onStatusChange(request.id, "rejected", adminComment)}
                disabled={isUpdating}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отклонить
              </button>
            </div>
          </>
        )}

        {request.status !== "pending" && request.admin_comment && (
          <div>
            <div className="text-xs text-[--color-text-secondary] mb-1">Комментарий админа</div>
            <div className="text-sm text-[--color-text-primary] p-2 bg-[--color-bg-secondary] rounded">{request.admin_comment}</div>
          </div>
        )}
      </div>
    </div>
  );
}
