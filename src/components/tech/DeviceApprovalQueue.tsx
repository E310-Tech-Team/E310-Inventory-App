"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Tag,
  Laptop,
  User,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  X,
  FileText,
} from "lucide-react";
import { Select } from "@/components/common/Select";

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
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [approveModalItem, setApproveModalItem] = useState<ApprovalItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<ApprovalItem | null>(null);
  const [viewModalItem, setViewModalItem] = useState<ApprovalItem | null>(null);

  // Approve form state
  const [assetTag, setAssetTag] = useState("");
  const [approveCondition, setApproveCondition] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Reject form state
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchQueue = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const url = new URL("/api/tech/approvals", window.location.origin);
      url.searchParams.set("status", statusFilter);
      if (searchQuery.trim()) {
        url.searchParams.set("search", searchQuery.trim());
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
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const openApproveModal = (item: ApprovalItem) => {
    setApproveModalItem(item);
    // Generate suggested asset tag
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

      setActionSuccess(`Device "${approveModalItem.name}" approved successfully.`);
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
      {/* Toast notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-2 p-4 text-sm text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-xl shadow-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter("pending")}
          className={`text-left p-5 rounded-2xl border transition-all ${
            statusFilter === "pending"
              ? "bg-amber-500/15 border-amber-500/50 ring-2 ring-amber-500/20"
              : "bg-surface border-border hover:border-amber-500/40 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Pending Verification
            </span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-foreground">{counts.pending}</div>
          <p className="mt-1 text-xs text-muted">Awaiting inspection & tagging</p>
        </button>

        <button
          onClick={() => setStatusFilter("approved")}
          className={`text-left p-5 rounded-2xl border transition-all ${
            statusFilter === "approved"
              ? "bg-emerald-500/15 border-emerald-500/50 ring-2 ring-emerald-500/20"
              : "bg-surface border-border hover:border-emerald-500/40 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Verified & Active
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-foreground">{counts.approved}</div>
          <p className="mt-1 text-xs text-muted">Linked to official catalog</p>
        </button>

        <button
          onClick={() => setStatusFilter("rejected")}
          className={`text-left p-5 rounded-2xl border transition-all ${
            statusFilter === "rejected"
              ? "bg-rose-500/15 border-rose-500/50 ring-2 ring-rose-500/20"
              : "bg-surface border-border hover:border-rose-500/40 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Rejected
            </span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-foreground">{counts.rejected}</div>
          <p className="mt-1 text-xs text-muted">Requires staff resubmission</p>
        </button>

        <button
          onClick={() => setStatusFilter("all")}
          className={`text-left p-5 rounded-2xl border transition-all ${
            statusFilter === "all"
              ? "bg-brand-teal/15 border-brand-teal/50 ring-2 ring-brand-teal/20"
              : "bg-surface border-border hover:border-brand-teal/40 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Total Submissions
            </span>
            <div className="p-2 rounded-xl bg-surface-elevated text-brand-teal border border-border">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-foreground">{counts.total}</div>
          <p className="mt-1 text-xs text-muted">All self-registered devices</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by device, serial, or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-surface-elevated border border-border rounded-xl focus:outline-none focus:border-brand-teal text-foreground placeholder:text-muted transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="inline-flex p-1 bg-surface-elevated rounded-xl border border-border text-xs font-semibold text-muted">
            {(["pending", "approved", "rejected", "all"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  statusFilter === filter
                    ? "bg-surface text-foreground font-bold shadow-xs border border-border"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchQueue(true)}
            disabled={refreshing}
            className="p-2 text-muted hover:text-foreground bg-surface border border-border rounded-xl hover:bg-surface-elevated transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-brand-teal mx-auto" />
            <p className="mt-3 text-sm text-muted font-medium">Loading approval queue...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center mx-auto text-muted">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-foreground">
              No devices found in this view
            </h3>
            <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
              {statusFilter === "pending"
                ? "All staff-registered hardware has been verified. No pending approvals!"
                : "No device records matching your current filter criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-elevated border-b border-border text-xs font-bold text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4">Equipment & Details</th>
                  <th className="py-3.5 px-4">Identifier / Serial</th>
                  <th className="py-3.5 px-4">Submitted By</th>
                  <th className="py-3.5 px-4">Condition</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-elevated/60 transition-colors">
                    {/* Equipment */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-teal/15 border border-brand-teal/25 flex items-center justify-center text-brand-teal flex-shrink-0">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{item.name}</div>
                          <div className="text-xs text-muted mt-0.5">
                            {item.category?.name || "Uncategorized"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Identifiers */}
                    <td className="py-4 px-4">
                      <div className="font-mono text-xs font-semibold text-foreground bg-surface-elevated border border-border px-2 py-0.5 rounded-md inline-block">
                        {item.serial_number || "No SN"}
                      </div>
                      {item.identifier_value && (
                        <div className="text-xs text-brand-teal flex items-center gap-1 mt-1 font-mono font-semibold">
                          <Tag className="w-3 h-3" />
                          <span>{item.identifier_value}</span>
                        </div>
                      )}
                    </td>

                    {/* Submitter */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-foreground">
                        {item.submitter?.name || item.created_by}
                      </div>
                      {item.submitter?.email && (
                        <div className="text-xs text-muted mt-0.5">
                          {item.submitter.email}
                        </div>
                      )}
                      <div className="text-[11px] text-muted mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Condition */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                          item.condition === "new"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            : item.condition === "good"
                            ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30"
                            : item.condition === "fair"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {item.condition}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {item.approval_status === "pending" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                      ) : item.approval_status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      {item.approval_status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openApproveModal(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-navy rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Tag</span>
                          </button>
                          <button
                            onClick={() => openRejectModal(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-colors shadow-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setViewModalItem(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-elevated hover:bg-surface border border-border text-foreground rounded-xl text-xs font-semibold transition-colors"
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
        )}
      </div>

      {/* APPROVE MODAL */}
      {approveModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border animate-scale-up text-foreground">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-brand-teal/15 text-brand-teal">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Approve & Tag Equipment</h3>
                  <p className="text-xs text-muted">Official catalog enrollment</p>
                </div>
              </div>
              <button
                onClick={() => setApproveModalItem(null)}
                className="text-muted hover:text-foreground p-1.5 rounded-xl hover:bg-surface-elevated transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="mt-4 space-y-4">
              {actionError && (
                <div className="p-3 text-xs text-rose-700 dark:text-rose-400 bg-rose-500/15 border border-rose-500/30 rounded-xl">
                  {actionError}
                </div>
              )}

              {/* Summary box */}
              <div className="p-3 bg-surface-elevated rounded-xl border border-border text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted">Device Name:</span>
                  <span className="font-semibold text-foreground">{approveModalItem.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Serial Number:</span>
                  <span className="font-mono text-foreground">{approveModalItem.serial_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Submitted By:</span>
                  <span className="text-foreground">
                    {approveModalItem.submitter?.name} ({approveModalItem.submitter?.email})
                  </span>
                </div>
              </div>

              {/* Asset Tag Input */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Assign Official Asset Tag
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                    placeholder="e.g. R4C-AST-1042"
                    className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-border rounded-xl focus:outline-none focus:border-brand-teal font-mono text-foreground placeholder:text-muted"
                  />
                </div>
                <p className="text-[11px] text-muted mt-1">
                  Unique inventory tag physically affixed or cataloged for this asset.
                </p>
              </div>

              {/* Condition */}
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

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  IT Verification Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="e.g. Verified hardware specs; barcode label applied on base."
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl focus:outline-none focus:border-brand-teal text-foreground placeholder:text-muted"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setApproveModalItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground bg-surface border border-border rounded-xl hover:bg-surface-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-navy rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border animate-scale-up text-foreground">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Reject Registration</h3>
                  <p className="text-xs text-muted">
                    Notify staff member of reason for non-approval
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalItem(null)}
                className="text-muted hover:text-foreground p-1.5 rounded-xl hover:bg-surface-elevated transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              {actionError && (
                <div className="p-3 text-xs text-rose-700 dark:text-rose-400 bg-rose-500/15 border border-rose-500/30 rounded-xl">
                  {actionError}
                </div>
              )}

              <div className="p-3 bg-surface-elevated rounded-xl border border-border text-xs space-y-1">
                <span className="text-muted">Device: </span>
                <span className="font-semibold text-foreground">{rejectModalItem.name}</span>
                <span className="text-muted font-mono"> ({rejectModalItem.serial_number})</span>
                <div className="text-muted mt-1">
                  Staff Submitter: {rejectModalItem.submitter?.name} ({rejectModalItem.submitter?.email})
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this equipment cannot be registered into inventory..."
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl focus:outline-none focus:border-rose-500 text-foreground placeholder:text-muted"
                />
              </div>

              {/* Quick suggestions */}
              <div>
                <span className="text-[11px] font-semibold text-muted">Quick suggestions:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
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
                      className="text-[11px] px-2 py-1 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-foreground transition-colors text-left"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground bg-surface border border-border rounded-xl hover:bg-surface-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border animate-scale-up text-foreground">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-brand-teal/15 text-brand-teal">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Equipment Record</h3>
                  <p className="text-xs text-muted">Archived verification details</p>
                </div>
              </div>
              <button
                onClick={() => setViewModalItem(null)}
                className="text-muted hover:text-foreground p-1.5 rounded-xl hover:bg-surface-elevated transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-surface-elevated rounded-xl border border-border">
                <div>
                  <span className="text-muted">Device Name:</span>
                  <div className="font-semibold text-foreground mt-0.5">{viewModalItem.name}</div>
                </div>
                <div>
                  <span className="text-muted">Category:</span>
                  <div className="font-semibold text-foreground mt-0.5">
                    {viewModalItem.category?.name || "Uncategorized"}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Serial Number:</span>
                  <div className="font-mono text-foreground mt-0.5">
                    {viewModalItem.serial_number || "None"}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Asset Tag:</span>
                  <div className="font-mono text-brand-teal font-bold mt-0.5">
                    {viewModalItem.identifier_value || "None"}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Condition:</span>
                  <div className="font-semibold capitalize text-foreground mt-0.5">
                    {viewModalItem.condition}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Approval Status:</span>
                  <div className="font-bold capitalize text-foreground mt-0.5">
                    {viewModalItem.approval_status}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-surface-elevated rounded-xl border border-border">
                <span className="text-muted">Custody / Submitting Staff:</span>
                <div className="font-semibold text-foreground mt-0.5">
                  {viewModalItem.submitter?.name}
                </div>
                <div className="text-muted">{viewModalItem.submitter?.email}</div>
                {viewModalItem.submitter?.phone && (
                  <div className="text-muted">{viewModalItem.submitter?.phone}</div>
                )}
              </div>

              {viewModalItem.notes && (
                <div className="p-3 bg-surface-elevated rounded-xl border border-border">
                  <span className="text-muted">Notes & Logs:</span>
                  <div className="text-foreground whitespace-pre-wrap mt-0.5">
                    {viewModalItem.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setViewModalItem(null)}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground bg-surface border border-border rounded-xl hover:bg-surface-elevated transition-colors"
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
