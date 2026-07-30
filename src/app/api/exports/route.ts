import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth/permissions";
import { getEffectiveStatus } from "@/lib/checkout-status";
import { dataStore } from "@/lib/data";
import { Category, Checkout, Item } from "@/types";

export const dynamic = "force-dynamic";

type ReportType = "assignments" | "inventory";
type ExportFormat = "csv" | "excel";
type ExportValue = string | number | null;
type ExportRow = Record<string, ExportValue>;

function parseReportType(value: string | null): ReportType {
  return value === "inventory" ? "inventory" : "assignments";
}

function parseExportFormat(value: string | null): ExportFormat {
  return value === "excel" ? "excel" : "csv";
}

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinRange(value: string, from: Date | null, to: Date | null): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function csvEscape(value: ExportValue): string {
  const text = value === null ? "" : String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: ExportRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
}

function htmlEscape(value: ExportValue): string {
  return (value === null ? "" : String(value))
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toExcelHtml(rows: ExportRow[]): string {
  if (rows.length === 0) {
    return "<!doctype html><meta charset=\"utf-8\"><table></table>";
  }

  const headers = Object.keys(rows[0]);
  return `<!doctype html>
<html>
  <head><meta charset="utf-8"></head>
  <body>
    <table>
      <thead><tr>${headers.map((header) => `<th>${htmlEscape(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows
          .map(
            (row) =>
              `<tr>${headers
                .map((header) => `<td>${htmlEscape(row[header])}</td>`)
                .join("")}</tr>`
          )
          .join("")}
      </tbody>
    </table>
  </body>
</html>`;
}

function identifierFor(item: Item | undefined): string | null {
  if (!item) return null;
  if (item.identifierValue) return item.identifierValue;
  if (item.serialNumber) return item.serialNumber;
  return null;
}

function buildAssignmentRows({
  categories,
  checkouts,
  categoryId,
  from,
  items,
  status,
  to,
}: {
  categories: Category[];
  checkouts: Checkout[];
  categoryId: string | null;
  from: Date | null;
  items: Item[];
  status: string | null;
  to: Date | null;
}): ExportRow[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return checkouts
    .filter((checkout) => isWithinRange(checkout.dateCollected, from, to))
    .filter((checkout) => {
      const item = itemById.get(checkout.itemId);
      if (categoryId && item?.categoryId !== categoryId) return false;
      const effectiveStatus = getEffectiveStatus(checkout);
      return !status || status === "all" || effectiveStatus === status;
    })
    .map((checkout) => {
      const item = itemById.get(checkout.itemId);
      const category = item ? categoryById.get(item.categoryId) : null;
      return {
        "Date Assigned": checkout.dateCollected,
        "Item Name": item?.name ?? "",
        Category: category?.name ?? "",
        Identifier: identifierFor(item),
        Quantity: checkout.quantity,
        "Assignment Status": getEffectiveStatus(checkout),
        "Assigned To": checkout.assignedToName,
        Phone: checkout.assignedToPhone,
        "Official Email": checkout.assignedToEmail,
        "Assigned By": checkout.collectedBy,
        "Due Date": checkout.dueDate,
        "Date Returned": checkout.dateReturned,
        "Condition On Collection": checkout.conditionOnCollection,
        "Condition On Return": checkout.conditionOnReturn,
        "Assignment Notes": checkout.collectionNotes,
        "Item Notes": item?.notes ?? null,
      };
    });
}

function buildInventoryRows({
  categories,
  categoryId,
  checkouts,
  from,
  items,
  status,
  to,
}: {
  categories: Category[];
  categoryId: string | null;
  checkouts: Checkout[];
  from: Date | null;
  items: Item[];
  status: string | null;
  to: Date | null;
}): ExportRow[] {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const activeCheckoutByItemId = new Map<string, Checkout>();

  checkouts
    .filter((checkout) => getEffectiveStatus(checkout) !== "returned")
    .sort((a, b) => b.dateCollected.localeCompare(a.dateCollected))
    .forEach((checkout) => {
      if (!activeCheckoutByItemId.has(checkout.itemId)) {
        activeCheckoutByItemId.set(checkout.itemId, checkout);
      }
    });

  return items
    .filter((item) => isWithinRange(item.createdAt, from, to))
    .filter((item) => !categoryId || item.categoryId === categoryId)
    .filter((item) => !status || status === "all" || item.status === status)
    .map((item) => {
      const category = categoryById.get(item.categoryId);
      const activeCheckout = activeCheckoutByItemId.get(item.id);
      return {
        "Created At": item.createdAt,
        "Item Name": item.name,
        Category: category?.name ?? "",
        Status: item.status === "checked-out" ? "assigned" : item.status,
        Condition: item.condition,
        "Identifier Type": item.identifierType,
        "Identifier Value": identifierFor(item),
        Quantity: item.quantity,
        "Assigned To": activeCheckout?.assignedToName ?? null,
        Phone: activeCheckout?.assignedToPhone ?? null,
        "Official Email": activeCheckout?.assignedToEmail ?? null,
        "Assigned By": activeCheckout?.collectedBy ?? null,
        Notes: item.notes,
      };
    });
}

export async function GET(request: NextRequest) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const searchParams = request.nextUrl.searchParams;
  const report = parseReportType(searchParams.get("report"));
  const format = parseExportFormat(searchParams.get("format"));
  const from = parseDateParam(searchParams.get("from"));
  const to = parseDateParam(searchParams.get("to"));
  const categoryId = searchParams.get("categoryId") || null;
  const status = searchParams.get("status") || "all";

  if (searchParams.get("from") && !from) {
    return NextResponse.json({ error: "Invalid start date/time" }, { status: 400 });
  }
  if (searchParams.get("to") && !to) {
    return NextResponse.json({ error: "Invalid end date/time" }, { status: 400 });
  }
  if (from && to && from > to) {
    return NextResponse.json(
      { error: "Start date/time must be before end date/time" },
      { status: 400 }
    );
  }

  try {
    const [categories, items, checkouts] = await Promise.all([
      dataStore.getCategories(),
      dataStore.getItems(),
      dataStore.getCheckouts(),
    ]);
    const rows =
      report === "inventory"
        ? buildInventoryRows({ categories, categoryId, checkouts, from, items, status, to })
        : buildAssignmentRows({ categories, categoryId, checkouts, from, items, status, to });

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const extension = format === "excel" ? "xls" : "csv";
    const filename = `ethree10-${report}-${timestamp}.${extension}`;
    const body = format === "excel" ? toExcelHtml(rows) : toCsv(rows);
    const contentType =
      format === "excel"
        ? "application/vnd.ms-excel; charset=utf-8"
        : "text/csv; charset=utf-8";

    return new NextResponse(body, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("Failed to generate export", error);
    return NextResponse.json(
      { error: "Couldn't generate export. Check Supabase configuration and try again." },
      { status: 500 }
    );
  }
}
