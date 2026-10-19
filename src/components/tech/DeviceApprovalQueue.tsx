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
    } catch (err: any) {
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
    } catch (err: any) {
      setActionError(err.message || "An error occurred");
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
    } catch (err: any) {
      setActionError(err.message || "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-2 p-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter("pending")}
          className={`text-left p-5 rounded-xl border transition-all ${
            statusFilter === "pending"
              ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Verification
            </span>
            <div className="p-2 rounded-lg bg-amber-100/80 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{counts.pending}</div>
          <p className="mt-1 text-xs text-slate-500">Awaiting inspection & tagging</p>
        </button>

        <button
          onClick={() => setStatusFilter("approved")}
          className={`text-left p-5 rounded-xl border transition-all ${
            statusFilter === "approved"
              ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Verified & Active
            </span>
            <div className="p-2 rounded-lg bg-emerald-100/80 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{counts.approved}</div>
          <p className="mt-1 text-xs text-slate-500">Linked to official catalog</p>
        </button>

        <button
          onClick={() => setStatusFilter("rejected")}
          className={`text-left p-5 rounded-xl border transition-all ${
            statusFilter === "rejected"
              ? "bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Rejected
            </span>
            <div className="p-2 rounded-lg bg-rose-100/80 text-rose-700">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{counts.rejected}</div>
          <p className="mt-1 text-xs text-slate-500">Requires staff resubmission</p>
        </button>

        <button
          onClick={() => setStatusFilter("all")}
          className={`text-left p-5 rounded-xl border transition-all ${
            statusFilter === "all"
              ? "bg-slate-100 border-slate-300 ring-2 ring-slate-400/20"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Submissions
            </span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{counts.total}</div>
          <p className="mt-1 text-xs text-slate-500">All self-registered devices</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by device, serial, or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
            {(["pending", "approved", "rejected", "all"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                  statusFilter === filter
                    ? "bg-white text-slate-900 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchQueue(true)}
            disabled={refreshing}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading approval queue...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No devices found in this view
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              {statusFilter === "pending"
                ? "All staff-registered hardware has been verified. No pending approvals!"
                : "No device records matching your current filter criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Equipment & Details</th>
                  <th className="py-3.5 px-4">Identifier / Serial</th>
                  <th className="py-3.5 px-4">Submitted By</th>
                  <th className="py-3.5 px-4">Condition</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Equipment */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {item.category?.name || "Uncategorized"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Identifiers */}
                    <td className="py-4 px-4">
                      <div className="font-mono text-xs font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded inline-block">
                        {item.serial_number || "No SN"}
                      </div>
                      {item.identifier_value && (
                        <div className="text-xs text-emerald-700 flex items-center gap-1 mt-1 font-mono">
                          <Tag className="w-3 h-3" />
                          <span>{item.identifier_value}</span>
                        </div>
                      )}
                    </td>

                    {/* Submitter */}
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-900">
                        {item.submitter?.name || item.created_by}
                      </div>
                      {item.submitter?.email && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.submitter.email}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
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
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          item.condition === "new"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.condition === "good"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : item.condition === "fair"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {item.condition}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      {item.approval_status === "pending" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                      ) : item.approval_status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Tag</span>
                          </button>
                          <button
                            onClick={() => openRejectModal(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors shadow-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setViewModalItem(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Approve & Tag Equipment</h3>
                  <p className="text-xs text-slate-500">Official catalog enrollment</p>
                </div>
              </div>
              <button
                onClick={() => setApproveModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="mt-4 space-y-4">
              {actionError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  {actionError}
                </div>
              )}

              {/* Summary box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Device Name:</span>
                  <span className="font-semibold text-slate-900">{approveModalItem.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Serial Number:</span>
                  <span className="font-mono text-slate-800">{approveModalItem.serial_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Submitted By:</span>
                  <span className="text-slate-800">
                    {approveModalItem.submitter?.name} ({approveModalItem.submitter?.email})
                  </span>
                </div>
              </div>

              {/* Asset Tag Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Official Asset Tag
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                    placeholder="e.g. R4C-AST-1042"
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Unique inventory tag physically affixed or cataloged for this asset.
                </p>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verified Condition
                </label>
                <select
                  value={approveCondition}
                  onChange={(e) => setApproveCondition(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                >
                  <option value="new">Brand New</option>
                  <option value="good">Good (Fully functional)</option>
                  <option value="fair">Fair (Minor wear, functional)</option>
                  <option value="damaged">Damaged (Requires repair)</option>
                </select>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  IT Verification Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="e.g. Verified hardware specs; barcode label applied on base."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApproveModalItem(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reject Registration</h3>
                  <p className="text-xs text-slate-500">
                    Notify staff member of reason for non-approval
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              {actionError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  {actionError}
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="text-slate-500">Device: </span>
                <span className="font-semibold text-slate-900">{rejectModalItem.name}</span>
                <span className="text-slate-400 font-mono"> ({rejectModalItem.serial_number})</span>
                <div className="text-slate-500 mt-1">
                  Staff Submitter: {rejectModalItem.submitter?.name} ({rejectModalItem.submitter?.email})
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this equipment cannot be registered into inventory..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-900"
                />
              </div>

              {/* Quick suggestions */}
              <div>
                <span className="text-[11px] font-medium text-slate-500">Quick suggestions:</span>
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
                      className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-left"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Equipment Record</h3>
                  <p className="text-xs text-slate-500">Archived verification details</p>
                </div>
              </div>
              <button
                onClick={() => setViewModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Device Name:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{viewModalItem.name}</div>
                </div>
                <div>
                  <span className="text-slate-500">Category:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {viewModalItem.category?.name || "Uncategorized"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Serial Number:</span>
                  <div className="font-mono text-slate-800 mt-0.5">
                    {viewModalItem.serial_number || "None"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Asset Tag:</span>
                  <div className="font-mono text-emerald-700 mt-0.5">
                    {viewModalItem.identifier_value || "None"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Condition:</span>
                  <div className="font-medium capitalize text-slate-900 mt-0.5">
                    {viewModalItem.condition}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Approval Status:</span>
                  <div className="font-semibold capitalize text-slate-900 mt-0.5">
                    {viewModalItem.approval_status}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500">Custody / Submitting Staff:</span>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {viewModalItem.submitter?.name}
                </div>
                <div className="text-slate-500">{viewModalItem.submitter?.email}</div>
                {viewModalItem.submitter?.phone && (
                  <div className="text-slate-500">{viewModalItem.submitter?.phone}</div>
                )}
              </div>

              {viewModalItem.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Notes & Logs:</span>
                  <div className="text-slate-800 whitespace-pre-wrap mt-0.5">
                    {viewModalItem.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewModalItem(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
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
