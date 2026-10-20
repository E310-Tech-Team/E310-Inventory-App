"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Download, FileSpreadsheet } from "lucide-react";
import { Category } from "@/types";
import { inputClass } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/common/Select";

type ReportType = "assignments" | "inventory";
type ExportFormat = "csv" | "excel";

function toIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function filenameFromDisposition(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const match = disposition.match(/filename="?([^";]+)"?/);
  return match?.[1] ?? fallback;
}

export function ExportsView({ categories }: { categories: Category[] }) {
  const [report, setReport] = useState<ReportType>("assignments");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = useMemo(
    () =>
      report === "assignments"
        ? [
            { value: "all", label: "All assignment statuses" },
            { value: "active", label: "Active" },
            { value: "returned", label: "Returned" },
            { value: "overdue", label: "Overdue" },
          ]
        : [
            { value: "all", label: "All item statuses" },
            { value: "available", label: "Available" },
            { value: "checked-out", label: "Assigned" },
            { value: "low-stock", label: "Low stock" },
          ],
    [report]
  );

  async function handleDownload(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const fromIso = toIso(from);
    const toIsoValue = toIso(to);
    if (from && !fromIso) {
      setError("Choose a valid start date and time.");
      return;
    }
    if (to && !toIsoValue) {
      setError("Choose a valid end date and time.");
      return;
    }
    if (fromIso && toIsoValue && new Date(fromIso) > new Date(toIsoValue)) {
      setError("Start date and time must come before end date and time.");
      return;
    }

    const params = new URLSearchParams({
      report,
      format,
      status,
    });
    if (categoryId !== "all") params.set("categoryId", categoryId);
    if (fromIso) params.set("from", fromIso);
    if (toIsoValue) params.set("to", toIsoValue);

    setDownloading(true);
    const response = await fetch(`/api/exports?${params.toString()}`);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Couldn't generate export.");
      setDownloading(false);
      return;
    }

    const blob = await response.blob();
    const fallback = `ethree10-${report}.${format === "excel" ? "xls" : "csv"}`;
    const filename = filenameFromDisposition(
      response.headers.get("Content-Disposition"),
      fallback
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setDownloading(false);
  }

  return (
    <div>
      <PageHeader
        title="Exports"
        description="Download filtered inventory and assignment records"
      />

      <div className="px-4 md:px-8 pb-8 animate-enter">
        <form
          onSubmit={handleDownload}
          className="interactive-card border border-border rounded-xl bg-surface p-4 md:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 items-end">
            <div>
              <Select
                label="Report"
                value={report}
                onChange={(event) => {
                  setReport(event.target.value as ReportType);
                  setStatus("all");
                }}
                options={[
                  { value: "assignments", label: "Assignments" },
                  { value: "inventory", label: "Inventory" },
                ]}
              />
            </div>

            <div>
              <Select
                label="Category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                options={[
                  { value: "all", label: "All categories" },
                  ...categories.map((category) => ({
                    value: category.id,
                    label: category.name,
                  })),
                ]}
              />
            </div>

            <div>
              <Select
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                options={statusOptions.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            </div>

            <label className="block">
              <span className="block text-xs font-semibold text-foreground mb-1.5">From</span>
              <div className="relative">
                <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  className={`${inputClass} pl-9`}
                  type="datetime-local"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </div>
            </label>

            <label className="block">
              <span className="block text-xs font-semibold text-foreground mb-1.5">To</span>
              <div className="relative">
                <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  className={`${inputClass} pl-9`}
                  type="datetime-local"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </div>
            </label>

            <div>
              <Select
                label="File Format"
                value={format}
                onChange={(event) => setFormat(event.target.value as ExportFormat)}
                options={[
                  { value: "csv", label: "CSV" },
                  { value: "excel", label: "Excel" },
                ]}
              />
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-status-overdue">{error}</p>}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted">
              <FileSpreadsheet className="h-4 w-4" />
              <span>{report === "assignments" ? "Assignment date" : "Item creation date"}</span>
            </div>
            <button
              type="submit"
              disabled={downloading}
              className="pressable inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-yellow px-4 py-2.5 text-sm font-bold text-brand-navy shadow-xs transition-all hover:brightness-105 disabled:opacity-50 sm:w-auto"
            >
              <Download className="h-4 w-4" />
              {downloading ? "Generating..." : "Download"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
