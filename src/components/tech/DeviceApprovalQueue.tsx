"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Tag,
  Check,
  X,
  FileText,
  Laptop,
} from "lucide-react";
import { Select } from "@/components/common/Select";
import { ShowMoreBar } from "@/components/ui/ShowMoreBar";

interface SubmitterInfo {
  name: string;
  email: string;
  phone: string;
  collectedAt: string;
  condition: string;
  notes: string | null;
}

interface ApprovalItem {
  id: string;
  name: string;
  serial_number: string;
  identifier_type: string | null;
  identifier_value: string | null;
  quantity: number | null;
  status: string;
  condition: string;
  notes: string | null;
  registered_by_staff: boolean;
  approval_status: "pending" | "approved" | "rejected";
  created_by: string;
  created_at: string;
  createdAt?: string;
  category: {
    id: string;
    name: string;
    tracking_type: string;
    return_type: string;
  } | null;
  submitter: SubmitterInfo;
}

interface QueueCounts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

function formatSubmissionDate(item: ApprovalItem): string {
  const dateVal = item.created_at || item.createdAt;
  if (!dateVal) return "Recently";
  const d = new Date(dateVal);
  return isNaN(d.getTime())
    ? "Recently"
    : d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

const CONDITION_TONE: Record<string, string> = {
  new: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  good: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  fair: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  damaged: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
};

export function DeviceApprovalQueue() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [counts, setCounts] = useState<QueueCounts>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">(
    "pending"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mobileLimit, setMobileLimit] = useState(6);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [approveModalItem, setApproveModalItem] = useState<ApprovalItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<ApprovalItem | null>(null);
  const [viewModalItem, setViewModalItem] = useState<ApprovalItem | null>(null);

  const [assetTag, setAssetTag] = useState("");
  const [approveCondition, setApproveCondition] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchQueue = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      try {
        const url = new URL("/api/tech/approvals", window.location.origin);
        url.searchParams.set("status", statusFilter);
        if (debouncedSearch.trim()) {
          url.searchParams.set("search", debouncedSearch.trim());
        }

        const res = await fetch(url.toString());
        if (!res.ok) {
          throw new Error(`Failed to load queue: ${res.statusText}`);
        }
        const data = await res.json();
        setItems(data.approvals || []);
        setCounts(
          data.counts || {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: 0,
          }
        );
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, debouncedSearch]
  );

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const openApproveModal = (item: ApprovalItem) => {
    setApproveModalItem(item);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setAssetTag(`R4C-AST-${randomSuffix}`);
    setApproveCondition(item.condition);
    setApproveNotes(item.notes || "");
    setActionError(null);
  };

  const openRejectModal = (item: ApprovalItem) => {
    setRejectModalItem(item);
    setRejectionReason("");
    setActionError(null);
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveModalItem) return;

    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/tech/approvals/${approveModalItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          assetTag: assetTag.trim() || undefined,
          condition: approveCondition,
          notes: approveNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to approve device");
      }

      setActionSuccess(`Device "${approveModalItem.name}" approved and added to catalog.`);
      setApproveModalItem(null);
      fetchQueue();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalItem) return;

    if (!rejectionReason.trim()) {
      setActionError("Please provide a reason for rejecting the registration.");
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/tech/approvals/${rejectModalItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectionReason: rejectionReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reject device");
      }

      setActionSuccess(`Registration for "${rejectModalItem.name}" rejected.`);
      setRejectModalItem(null);
      fetchQueue();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {actionSuccess && (
        <div className="flex items-center gap-2.5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={() => {
            setStatusFilter("pending");
            setMobileLimit(6);
          }}
          className={`text-left p-3.5 sm:p-5 rounded-2xl border bg-surface transition-colors shadow-[0_1px_4px_rgba(0,0,0,0.02)] ${
            statusFilter === "pending"
              ? "border-amber-500/40 bg-amber-500/[0.03]"
              : "border-border/70 hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted">Pending Review</span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {counts.pending}
          </div>
          <p className="hidden sm:block mt-1 text-xs text-muted">Awaiting inspection</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("approved");
            setMobileLimit(6);
          }}
          className={`text-left p-3.5 sm:p-5 rounded-2xl border bg-surface transition-colors shadow-[0_1px_4px_rgba(0,0,0,0.02)] ${
            statusFilter === "approved"
              ? "border-emerald-500/40 bg-emerald-500/[0.03]"
              : "border-border/70 hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted">Approved</span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {counts.approved}
          </div>
          <p className="hidden sm:block mt-1 text-xs text-muted">Verified in catalog</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("rejected");
            setMobileLimit(6);
          }}
          className={`text-left p-3.5 sm:p-5 rounded-2xl border bg-surface transition-colors shadow-[0_1px_4px_rgba(0,0,0,0.02)] ${
            statusFilter === "rejected"
              ? "border-rose-500/40 bg-rose-500/[0.03]"
              : "border-border/70 hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted">Rejected</span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {counts.rejected}
          </div>
          <p className="hidden sm:block mt-1 text-xs text-muted">Returned to staff</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter("all");
            setMobileLimit(6);
          }}
          className={`text-left p-3.5 sm:p-5 rounded-2xl border bg-surface transition-colors shadow-[0_1px_4px_rgba(0,0,0,0.02)] ${
            statusFilter === "all"
              ? "border-accent/40 bg-accent/[0.03]"
              : "border-border/70 hover:border-border"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted">Total Submissions</span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-surface-elevated/80 text-muted flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {counts.total}
          </div>
          <p className="hidden sm:block mt-1 text-xs text-muted">All staff registrations</p>
        </button>
      </div>

      {/* Queue Panel */}
      <div className="bg-surface border border-border/70 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
        {/* Panel Filter Header */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search device, serial, or staff..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setMobileLimit(6);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:border-accent text-foreground placeholder:text-muted transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial overflow-x-auto no-scrollbar">
              <div className="inline-flex min-w-full sm:min-w-0 p-0.5 bg-surface-elevated/70 rounded-xl border border-border/70 text-xs font-medium whitespace-nowrap">
                {(["pending", "approved", "rejected", "all"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setStatusFilter(filter);
                      setMobileLimit(6);
                    }}
                    className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg capitalize transition-colors ${
                      statusFilter === filter
                        ? "bg-surface text-foreground shadow-2xs"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchQueue(true)}
              disabled={refreshing}
              className="p-2 text-muted hover:text-foreground bg-surface border border-border/80 rounded-xl hover:bg-surface-elevated transition-colors shrink-0"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-14 text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-accent mx-auto" />
            <p className="mt-3 text-xs text-muted font-medium">Loading approval queue...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-11 h-11 rounded-full bg-surface-elevated border border-border/60 flex items-center justify-center mx-auto text-muted">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">No registrations found</h3>
            <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
              {statusFilter === "pending"
                ? "All staff-registered devices have been reviewed."
                : "No records matched your current filter."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Clean List */}
            <div className="md:hidden">
              <div className="divide-y divide-border/50">
                {items.slice(0, mobileLimit).map((item) => (
                  <div key={item.id} className="px-3.5 py-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-foreground truncate min-w-0">
                        {item.name}
                      </p>
                      <div className="shrink-0">
                        <ApprovalStatusPill status={item.approval_status} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted truncate min-w-0">
                        <span className="font-medium text-foreground">
                          {item.submitter?.name || item.created_by}
                        </span>
                        {" · "}
                        <span className="font-mono">{item.serial_number || "No SN"}</span>
                        {" · "}
                        <span className="tabular-nums">{formatSubmissionDate(item)}</span>
                      </p>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.approval_status === "pending" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openRejectModal(item)}
                              className="px-2 py-1 bg-surface border border-border/80 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg text-[11px] font-medium transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => openApproveModal(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent hover:bg-accent-hover text-white rounded-lg text-[11px] font-semibold transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setViewModalItem(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface border border-border/80 hover:bg-surface-elevated text-foreground rounded-lg text-[11px] font-medium transition-colors"
                          >
                            <FileText className="w-3 h-3 text-muted" />
                            <span>Inspect</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <ShowMoreBar
                visibleCount={Math.min(mobileLimit, items.length)}
                totalCount={items.length}
                initialLimit={6}
                noun="submissions"
                onShowMore={() => setMobileLimit((prev) => prev + 6)}
                onCollapse={() => setMobileLimit(6)}
              />
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-elevated/40 border-b border-border/60 text-xs font-medium text-muted">
                    <th className="py-3 px-5 font-medium">Equipment</th>
                    <th className="py-3 px-4 font-medium">Serial / Tag</th>
                    <th className="py-3 px-4 font-medium">Submitted By</th>
                    <th className="py-3 px-4 font-medium">Condition</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-elevated/40 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-foreground">{item.name}</div>
                        <div className="text-xs text-muted mt-0.5">
                          {item.category?.name || "Uncategorized"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs text-foreground">
                          {item.serial_number || "No SN"}
                        </div>
                        {item.identifier_value && (
                          <div className="text-[11px] text-accent flex items-center gap-1 mt-0.5 font-mono">
                            <Tag className="w-3 h-3" />
                            <span>{item.identifier_value}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-foreground">
                          {item.submitter?.name || item.created_by}
                        </div>
                        <div className="text-xs text-muted mt-0.5 tabular-nums">
                          {item.submitter?.email ? `${item.submitter.email} · ` : ""}
                          {formatSubmissionDate(item)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${
                            CONDITION_TONE[item.condition] ??
                            "bg-surface-elevated text-muted border-border/60"
                          }`}
                        >
                          {item.condition}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <ApprovalStatusPill status={item.approval_status} />
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        {item.approval_status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openApproveModal(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve & Tag</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openRejectModal(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface border border-border/80 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-medium transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setViewModalItem(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-elevated border border-border/80 text-foreground rounded-xl text-xs font-medium transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-muted" />
                            <span>Inspect</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* APPROVE MODAL */}
      {approveModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-xl border border-border/70 animate-scale-up text-foreground">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent-soft text-accent">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Approve & Tag Equipment
                  </h3>
                  <p className="text-xs text-muted">Enroll device into official catalog</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApproveModalItem(null)}
                className="text-muted hover:text-foreground p-1.5 rounded-xl hover:bg-surface-elevated transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="mt-4 space-y-4">
              {actionError && (
                <div className="p-3 text-xs text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  {actionError}
                </div>
              )}

              <div className="p-3.5 bg-surface-elevated/50 rounded-xl border border-border/60 text-xs space-y-1.5">
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Device</span>
                  <span className="font-medium text-foreground">{approveModalItem.name}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Serial Number</span>
                  <span className="font-mono text-foreground">{approveModalItem.serial_number}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Submitted By</span>
                  <span className="text-foreground text-right">
                    {approveModalItem.submitter?.name} ({approveModalItem.submitter?.email})
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Assign Official Asset Tag
                </label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                    placeholder="e.g. R4C-AST-1042"
                    className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:border-accent font-mono text-foreground placeholder:text-muted"
                  />
                </div>
                <p className="text-[11px] text-muted mt-1">
                  Unique inventory identifier assigned to this asset.
                </p>
              </div>

              <div>
                <Select
                  label="Verified Condition"
                  value={approveCondition}
                  onChange={(e) => setApproveCondition(e.target.value)}
                  options={[
                    { value: "new", label: "Brand New" },
                    { value: "good", label: "Good (Fully functional)" },
                    { value: "fair", label: "Fair (Minor wear, functional)" },
                    { value: "damaged", label: "Damaged (Requires repair)" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  IT Verification Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="e.g. Verified hardware specs; asset label affixed."
                  className="w-full px-3 py-2 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:border-accent text-foreground placeholder:text-muted"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setApproveModalItem(null)}
                  className="px-4 py-2 text-xs font-medium text-foreground bg-surface border border-border/80 rounded-xl hover:bg-surface-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm & Approve</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-xl border border-border/70 animate-scale-up text-foreground">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Reject Registration</h3>
                  <p className="text-xs text-muted">
                    Provide feedback explaining why the registration was declined
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="text-muted hover:text-foreground p-1.5 rounded-xl hover:bg-surface-elevated transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              {actionError && (
                <div className="p-3 text-xs text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  {actionError}
                </div>
              )}

              <div className="p-3.5 bg-surface-elevated/50 rounded-xl border border-border/60 text-xs space-y-1">
                <div>
                  <span className="text-muted">Device: </span>
                  <span className="font-medium text-foreground">{rejectModalItem.name}</span>
                  <span className="text-muted font-mono"> ({rejectModalItem.serial_number})</span>
                </div>
                <div className="text-muted">
                  Submitted by: {rejectModalItem.submitter?.name} (
                  {rejectModalItem.submitter?.email})
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this equipment cannot be registered..."
                  className="w-full px-3 py-2 text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:border-rose-500 text-foreground placeholder:text-muted"
                />
              </div>

              <div>
                <span className="text-[11px] font-medium text-muted">Quick suggestions:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    "Serial number does not match physical unit",
                    "Personal device not authorized for company registry",
                    "Device already registered under another staff account",
                    "Missing hardware model specifications",
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setRejectionReason(sug)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-elevated/70 hover:bg-surface-elevated border border-border/60 text-foreground transition-colors text-left"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  className="px-4 py-2 text-xs font-medium text-foreground bg-surface border border-border/80 rounded-xl hover:bg-surface-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT MODAL */}
      {viewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-xl border border-border/70 animate-scale-up text-foreground">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent-soft text-accent">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Equipment Record</h3>
                  <p className="text-xs text-muted">Verification details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewModalItem(null)}
                className="text-muted hover:text-foreground p-1.5 rounded-xl hover:bg-surface-elevated transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-surface-elevated/50 rounded-xl border border-border/60">
                <div>
                  <span className="text-muted">Device Name</span>
                  <div className="font-medium text-foreground mt-0.5">{viewModalItem.name}</div>
                </div>
                <div>
                  <span className="text-muted">Category</span>
                  <div className="font-medium text-foreground mt-0.5">
                    {viewModalItem.category?.name || "Uncategorized"}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Serial Number</span>
                  <div className="font-mono text-foreground mt-0.5">
                    {viewModalItem.serial_number || "None"}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Asset Tag</span>
                  <div className="font-mono text-accent font-medium mt-0.5">
                    {viewModalItem.identifier_value || "None"}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Condition</span>
                  <div className="font-medium capitalize text-foreground mt-0.5">
                    {viewModalItem.condition}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Approval Status</span>
                  <div className="font-medium capitalize text-foreground mt-0.5">
                    {viewModalItem.approval_status}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-surface-elevated/50 rounded-xl border border-border/60 space-y-0.5">
                <span className="text-muted">Submitted By</span>
                <div className="font-medium text-foreground">
                  {viewModalItem.submitter?.name}
                </div>
                <div className="text-muted">{viewModalItem.submitter?.email}</div>
                {viewModalItem.submitter?.phone && (
                  <div className="text-muted">{viewModalItem.submitter.phone}</div>
                )}
              </div>

              {viewModalItem.notes && (
                <div className="p-3.5 bg-surface-elevated/50 rounded-xl border border-border/60">
                  <span className="text-muted">Notes</span>
                  <div className="text-foreground whitespace-pre-wrap mt-1">
                    {viewModalItem.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => setViewModalItem(null)}
                className="px-4 py-2 text-xs font-medium text-foreground bg-surface border border-border/80 rounded-xl hover:bg-surface-elevated transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalStatusPill({ status }: { status: "pending" | "approved" | "rejected" }) {
  const styles =
    status === "pending"
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
      : status === "approved"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
      : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";

  const dot =
    status === "pending"
      ? "bg-amber-500"
      : status === "approved"
      ? "bg-emerald-500"
      : "bg-rose-500";

  const label =
    status === "pending" ? "Pending" : status === "approved" ? "Approved" : "Rejected";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span>{label}</span>
    </span>
  );
}
