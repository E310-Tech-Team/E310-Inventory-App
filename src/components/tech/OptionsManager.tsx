"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Laptop,
  Tag,
  AlertTriangle,
  Building2,
  Plus,
  Check,
  X,
  Edit2,
  Trash2,
  Power,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";
import { PortalOption } from "@/types";

type GroupKey = "device_type" | "device_brand" | "issue_type" | "department";

interface GroupConfig {
  key: GroupKey;
  label: string;
  description: string;
  icon: typeof Laptop;
  placeholder: string;
}

const GROUPS: GroupConfig[] = [
  {
    key: "device_type",
    label: "Device Types",
    description: "Hardware categories available during self-registration and checkouts.",
    icon: Laptop,
    placeholder: "e.g. Graphic Tablet, Audio Interface",
  },
  {
    key: "device_brand",
    label: "Brands & Manufacturers",
    description: "Approved equipment brands and manufacturers.",
    icon: Tag,
    placeholder: "e.g. Microsoft, Asus, Sony",
  },
  {
    key: "issue_type",
    label: "Issue & Complaint Types",
    description: "Categories for staff hardware tickets and fault reports.",
    icon: AlertTriangle,
    placeholder: "e.g. Trackpad Failure, Bluetooth Sync Error",
  },
  {
    key: "department",
    label: "Organization Departments",
    description: "Official departments used for staff profiles and equipment assignment.",
    icon: Building2,
    placeholder: "e.g. Partnerships & Development",
  },
];

export function OptionsManager() {
  const [activeTab, setActiveTab] = useState<GroupKey>("device_type");
  const [options, setOptions] = useState<PortalOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // fetchOptions is used by the refresh button (event handler — allowed to call setState).
  const fetchOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/tech/options");
      if (res.ok) {
        const data = await res.json();
        setOptions(data.options ?? []);
      }
    } catch (err) {
      console.error("Failed to load options:", err);
      setFeedback({ type: "error", message: "Failed to load options from server." });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: inline promise chain so setState only fires inside async callbacks,
  // never synchronously in the effect body (satisfies react-hooks/set-state-in-effect).
  useEffect(() => {
    let active = true;
    fetch("/api/tech/options")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (active && data) setOptions(data.options ?? []); })
      .catch((err) => {
        console.error("Failed to load options:", err);
        if (active) setFeedback({ type: "error", message: "Failed to load options from server." });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Current tab filtered options sorted by displayOrder
  const currentOptions = options
    .filter((opt) => opt.categoryGroup === activeTab)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label));

  async function handleAddOption(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/tech/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryGroup: activeTab,
          label: newLabel.trim(),
          value: newValue.trim() || undefined,
          displayOrder: currentOptions.length + 1,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", message: data.error ?? "Failed to add option." });
      } else {
        setOptions((prev) => [...prev, data.option]);
        setNewLabel("");
        setNewValue("");
        setFeedback({ type: "success", message: `Added "${data.option.label}" successfully.` });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error creating option." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(opt: PortalOption) {
    const nextState = !opt.isActive;
    try {
      const res = await fetch(`/api/tech/options/${opt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextState }),
      });

      if (res.ok) {
        setOptions((prev) =>
          prev.map((item) => (item.id === opt.id ? { ...item, isActive: nextState } : item))
        );
      }
    } catch (err) {
      console.error("Toggle active error:", err);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editLabel.trim()) return;

    try {
      const res = await fetch(`/api/tech/options/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabel.trim() }),
      });

      if (res.ok) {
        setOptions((prev) =>
          prev.map((item) => (item.id === id ? { ...item, label: editLabel.trim() } : item))
        );
        setEditingId(null);
      }
    } catch (err) {
      console.error("Save edit error:", err);
    }
  }

  async function handleReorder(opt: PortalOption, direction: "up" | "down") {
    const currentIndex = currentOptions.findIndex((item) => item.id === opt.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentOptions.length) return;

    const targetOpt = currentOptions[targetIndex];
    const newOrder = targetOpt.displayOrder;
    const targetNewOrder = opt.displayOrder;

    try {
      await Promise.all([
        fetch(`/api/tech/options/${opt.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: newOrder }),
        }),
        fetch(`/api/tech/options/${targetOpt.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: targetNewOrder }),
        }),
      ]);

      setOptions((prev) =>
        prev.map((item) => {
          if (item.id === opt.id) return { ...item, displayOrder: newOrder };
          if (item.id === targetOpt.id) return { ...item, displayOrder: targetNewOrder };
          return item;
        })
      );
    } catch (err) {
      console.error("Reorder error:", err);
    }
  }

  async function handleDelete(opt: PortalOption) {
    if (!confirm(`Are you sure you want to deactivate "${opt.label}"?`)) return;

    try {
      const res = await fetch(`/api/tech/options/${opt.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setOptions((prev) =>
          prev.map((item) => (item.id === opt.id ? { ...item, isActive: false } : item))
        );
        setFeedback({ type: "success", message: `Deactivated "${opt.label}".` });
      }
    } catch {
      setFeedback({ type: "error", message: "Error deactivating option." });
    }
  }

  const currentGroupConfig = GROUPS.find((g) => g.key === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Category Group Tabs */}
      <div className="flex border-b border-border overflow-x-auto scrollbar-none">
        {GROUPS.map((grp) => {
          const Icon = grp.icon;
          const isActive = activeTab === grp.key;
          const count = options.filter((o) => o.categoryGroup === grp.key && o.isActive).length;

          return (
            <button
              key={grp.key}
              onClick={() => {
                setActiveTab(grp.key);
                setEditingId(null);
                setFeedback(null);
              }}
              className={`flex items-center gap-2.5 px-5 py-3.5 border-b-2 text-sm font-bold whitespace-nowrap transition-colors ${
                isActive
                  ? "border-brand-teal text-foreground"
                  : "border-transparent text-muted hover:text-foreground hover:border-border"
              }`}
            >
              <Icon className="w-4 h-4 text-brand-teal" />
              <span>{grp.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isActive
                    ? "bg-brand-teal/20 text-brand-teal border border-brand-teal/30"
                    : "bg-surface-elevated text-muted border border-border"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Description & Feedback Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs sm:text-sm text-muted">{currentGroupConfig.description}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchOptions();
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground self-start transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold border flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
              : "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add New Option Form */}
      <form
        onSubmit={handleAddOption}
        className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3 shadow-xs"
      >
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Add New {currentGroupConfig.label.slice(0, -1)}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => {
                setNewLabel(e.target.value);
                if (!newValue) {
                  setNewValue(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "")
                  );
                }
              }}
              placeholder={currentGroupConfig.placeholder}
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface-elevated text-foreground text-sm outline-none transition-colors focus:border-brand-teal placeholder:text-muted"
              required
            />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Slug / ID (auto)"
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface-elevated font-mono text-xs outline-none transition-colors focus:border-brand-teal text-muted placeholder:text-muted"
            />
            <button
              type="submit"
              disabled={submitting || !newLabel.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-yellow hover:bg-brand-yellow/90 text-brand-navy text-xs sm:text-sm font-bold transition-all disabled:opacity-50 shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      </form>

      {/* Options List */}
      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-surface-elevated text-xs font-bold text-muted uppercase tracking-wider grid grid-cols-12 gap-2 items-center">
          <span className="col-span-6 sm:col-span-5">Label</span>
          <span className="hidden sm:block col-span-3">System Identifier</span>
          <span className="col-span-3 sm:col-span-2 text-center">Status</span>
          <span className="col-span-3 sm:col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-surface-elevated animate-pulse rounded-xl" />
            ))}
          </div>
        ) : currentOptions.length === 0 ? (
          <div className="py-12 text-center text-muted text-sm">
            No options registered for this group yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {currentOptions.map((opt, idx) => {
              const isEditing = editingId === opt.id;

              return (
                <div
                  key={opt.id}
                  className={`px-5 py-3.5 grid grid-cols-12 gap-2 items-center transition-colors ${
                    !opt.isActive ? "bg-surface-elevated/40 opacity-60" : "hover:bg-surface-elevated/50"
                  }`}
                >
                  {/* Label / Inline Edit */}
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:border-brand-teal"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(opt.id)}
                          className="p-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded-lg bg-surface-elevated text-muted hover:text-foreground"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                    )}
                  </div>

                  {/* Slug / Value */}
                  <div className="hidden sm:block col-span-3">
                    <span className="font-mono text-xs text-muted bg-surface-elevated border border-border px-2 py-0.5 rounded-md">
                      {opt.value}
                    </span>
                  </div>

                  {/* Status Toggle */}
                  <div className="col-span-3 sm:col-span-2 flex justify-center">
                    <button
                      onClick={() => handleToggleActive(opt)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                        opt.isActive
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                          : "bg-surface-elevated text-muted border-border hover:bg-surface"
                      }`}
                      title={opt.isActive ? "Active (Click to disable)" : "Disabled (Click to enable)"}
                    >
                      <Power className="w-3 h-3" />
                      <span>{opt.isActive ? "Active" : "Disabled"}</span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleReorder(opt, "up")}
                      disabled={idx === 0}
                      className="p-1 text-muted hover:text-foreground disabled:opacity-20 transition-colors"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleReorder(opt, "down")}
                      disabled={idx === currentOptions.length - 1}
                      className="p-1 text-muted hover:text-foreground disabled:opacity-20 transition-colors"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(opt.id);
                        setEditLabel(opt.label);
                      }}
                      className="p-1 text-muted hover:text-foreground transition-colors"
                      title="Edit label"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {opt.isActive && (
                      <button
                        onClick={() => handleDelete(opt)}
                        className="p-1 text-muted hover:text-rose-500 transition-colors"
                        title="Deactivate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
