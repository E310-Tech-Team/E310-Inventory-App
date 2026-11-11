"use client";

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Category } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/common/Select";
import { DatePicker } from "@/components/common/DatePicker";

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
        title="Data Exports"
        description="Download filtered inventory and assignment records"
      />

      <div className="px-4 md:px-8 pb-6 sm:pb-12 animate-enter">
        <form
          onSubmit={handleDownload}
          className="border border-border/70 rounded-2xl bg-surface p-4 sm:p-5 md:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.02)]"
        >
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3 items-end">
            <div>
              <Select
                label="Report"
                triggerClassName="min-h-[38px]"
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
                triggerClassName="min-h-[38px]"
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
                triggerClassName="min-h-[38px]"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                options={statusOptions.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            </div>

            <div>
              <DatePicker
                label="From"
                includeTime
                defaultTime="00:00"
                value={from}
                onChange={setFrom}
                maxDate={to || undefined}
                placeholder="Start date & time"
              />
            </div>

            <div>
              <DatePicker
                label="To"
                includeTime
                defaultTime="23:59"
                value={to}
                onChange={setTo}
                minDate={from || undefined}
                placeholder="End date & time"
              />
            </div>

            <div>
              <Select
                label="File Format"
                triggerClassName="min-h-[38px]"
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

          <div className="mt-6 pt-4 border-t border-border/60 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted">
              <FileSpreadsheet className="h-4 w-4" />
              <span>{report === "assignments" ? "Filtered by assignment date" : "Filtered by item creation date"}</span>
            </div>
            <button
              type="submit"
              disabled={downloading}
              className="pressable inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent hover:bg-accent-hover px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors disabled:opacity-50 sm:w-auto"
            >
              <Download className="h-3.5 w-3.5" />
              {downloading ? "Generating..." : "Download"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
