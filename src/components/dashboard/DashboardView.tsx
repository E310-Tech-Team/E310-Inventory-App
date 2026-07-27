"use client";

import { useState, useMemo } from "react";
import { Category, Item, Checkout } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { StatCard } from "./StatCard";
import {
  getCheckedOutView,
  getOverdueView,
  getLowStockView,
  getCategoryBreakdown,
  getPersonHistory,
  getItemHistory,
} from "@/lib/dashboard";

const TABS = ["Overview", "By category", "History"] as const;
type Tab = (typeof TABS)[number];

export function DashboardView({
  categories,
  items,
  checkouts,
  now,
}: {
  categories: Category[];
  items: Item[];
  checkouts: Checkout[];
  now: number;
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [historyMode, setHistoryMode] = useState<"item" | "person">("person");
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id ?? "");

  const checkedOut = useMemo(() => getCheckedOutView(checkouts, items), [checkouts, items]);
  const overdue = useMemo(() => getOverdueView(checkouts, items), [checkouts, items]);
  const lowStock = useMemo(() => getLowStockView(items, categories), [items, categories]);
  const breakdown = useMemo(() => getCategoryBreakdown(items, categories), [items, categories]);
  const people = useMemo(() => {
    const names = new Set([
      ...checkouts.map((checkout) => checkout.assignedToName || checkout.collectedBy),
    ]);
    return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [checkouts]);
  const [selectedAdmin, setSelectedAdmin] = useState(people[0] ?? "");
  const activeSelectedAdmin = people.includes(selectedAdmin)
    ? selectedAdmin
    : people[0] ?? "";

  const itemHistory = useMemo(
    () => getItemHistory(checkouts, selectedItemId),
    [checkouts, selectedItemId]
  );
  const personHistory = useMemo(
    () => getPersonHistory(checkouts, activeSelectedAdmin),
    [activeSelectedAdmin, checkouts]
  );

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of everything in inventory" />

      <div className="px-4 md:px-8 pb-8 animate-enter">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Assigned" value={checkedOut.length} />
          <StatCard label="Overdue" value={overdue.length} tone="danger" />
          <StatCard label="Low stock" value={lowStock.length} tone="warning" />
          <StatCard label="Total items" value={items.length} />
        </div>

        <div className="flex gap-1 mb-4 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
            className={`pressable px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Overview" && (
          <div className="space-y-6">
            <Section title="Currently assigned">
              {checkedOut.length === 0 ? (
                <EmptyRow text="Nothing assigned right now." />
              ) : (
                <Table headers={["Item", "Assigned to", "Since", "Due", "Status"]}>
                  {checkedOut.map(({ checkout, item }) => (
                    <tr key={checkout.id} className="table-row border-b border-border last:border-0">
                      <Td>{item?.name ?? "Unknown"}</Td>
                      <Td>
                        <div>{checkout.assignedToName || checkout.collectedBy}</div>
                        <div className="text-xs text-muted font-mono">
                          {checkout.assignedToEmail || checkout.assignedToPhone || ""}
                        </div>
                      </Td>
                      <Td muted>{new Date(checkout.dateCollected).toLocaleDateString()}</Td>
                      <Td muted>{checkout.dueDate ? new Date(checkout.dueDate).toLocaleDateString() : "—"}</Td>
                      <td className="px-4 py-3">
                        <StatusPill status={checkout.dueDate && new Date(checkout.dueDate) < new Date() ? "overdue" : "active"} />
                      </td>
                    </tr>
                  ))}
                </Table>
              )}
            </Section>

            <Section title="Overdue">
              {overdue.length === 0 ? (
                <EmptyRow text="Nothing overdue. Good news." />
              ) : (
                <Table headers={["Item", "Assigned to", "Due date", "Days overdue"]}>
                  {overdue.map(({ checkout, item }) => {
                    const daysOverdue = Math.floor(
                      (now - new Date(checkout.dueDate!).getTime()) / 86400000
                    );
                    return (
                      <tr key={checkout.id} className="table-row border-b border-border last:border-0">
                        <Td>{item?.name ?? "Unknown"}</Td>
                        <Td>
                          <div>{checkout.assignedToName || checkout.collectedBy}</div>
                          <div className="text-xs text-muted font-mono">
                            {checkout.assignedToEmail || checkout.assignedToPhone || ""}
                          </div>
                        </Td>
                        <Td muted>{new Date(checkout.dueDate!).toLocaleDateString()}</Td>
                        <td className="px-4 py-3 text-status-overdue font-medium">{daysOverdue}d</td>
                      </tr>
                    );
                  })}
                </Table>
              )}
            </Section>

            <Section title="Low stock">
              {lowStock.length === 0 ? (
                <EmptyRow text="All supplies are above threshold." />
              ) : (
                <Table headers={["Item", "Category", "Remaining", "Threshold"]}>
                  {lowStock.map(({ item, category }) => (
                    <tr key={item.id} className="table-row border-b border-border last:border-0">
                      <Td>{item.name}</Td>
                      <Td muted>{category?.name ?? "—"}</Td>
                      <td className="px-4 py-3 text-status-low-stock font-medium font-mono">
                        {item.quantity}
                      </td>
                      <Td muted mono>{category?.lowStockThreshold ?? "—"}</Td>
                    </tr>
                  ))}
                </Table>
              )}
            </Section>
          </div>
        )}

        {tab === "By category" && (
          <Table headers={["Category", "Total items", "Assigned", "Available", "Low stock"]}>
            {breakdown.map(({ category, totalItems, checkedOut, available, lowStock }) => (
              <tr key={category.id} className="table-row border-b border-border last:border-0">
                <Td>{category.name}</Td>
                <Td muted mono>{totalItems}</Td>
                <Td muted mono>{checkedOut}</Td>
                <Td muted mono>{available}</Td>
                <td className="px-4 py-3 font-mono">
                  {lowStock > 0 ? (
                    <span className="text-status-low-stock font-medium">{lowStock}</span>
                  ) : (
                    <span className="text-muted">0</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}

        {tab === "History" && (
          <div>
            <div className="flex gap-1 mb-4">
              <button
                onClick={() => setHistoryMode("person")}
                className={`pressable px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  historyMode === "person"
                    ? "bg-accent text-white"
                    : "bg-surface border border-border text-muted"
                }`}
              >
                By person
              </button>
              <button
                onClick={() => setHistoryMode("item")}
                className={`pressable px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  historyMode === "item"
                    ? "bg-accent text-white"
                    : "bg-surface border border-border text-muted"
                }`}
              >
                By item
              </button>
            </div>

            {historyMode === "person" ? (
              <>
                {people.length > 0 && (
                  <select
                    className="mb-4 px-3 py-1.5 rounded-lg border border-border bg-surface text-sm"
                    value={activeSelectedAdmin}
                    onChange={(e) => setSelectedAdmin(e.target.value)}
                  >
                    {people.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                )}
                {personHistory.length === 0 ? (
                  <EmptyRow text="No checkout history for this person." />
                ) : (
                  <Table headers={["Item", "Assigned", "Returned", "Processed by", "Condition", "Status"]}>
                    {personHistory.map((c) => (
                      <tr key={c.id} className="table-row border-b border-border last:border-0">
                        <Td>{itemById.get(c.itemId)?.name ?? "Unknown"}</Td>
                        <Td muted>{new Date(c.dateCollected).toLocaleDateString()}</Td>
                        <Td muted>{c.dateReturned ? new Date(c.dateReturned).toLocaleDateString() : "—"}</Td>
                        <Td muted mono>{c.collectedBy}</Td>
                        <Td muted capitalize>{c.conditionOnReturn ?? c.conditionOnCollection}</Td>
                        <td className="px-4 py-3">
                          <StatusPill status={c.status === "returned" ? "returned" : (c.dueDate && new Date(c.dueDate) < new Date() ? "overdue" : "active")} />
                        </td>
                      </tr>
                    ))}
                  </Table>
                )}
              </>
            ) : (
              <>
                <select
                  className="mb-4 px-3 py-1.5 rounded-lg border border-border bg-surface text-sm"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {itemHistory.length === 0 ? (
                  <EmptyRow text="No checkout history for this item." />
                ) : (
                  <Table headers={["Assigned to", "Assigned", "Returned", "Processed by", "Condition", "Status"]}>
                    {itemHistory.map((c) => (
                      <tr key={c.id} className="table-row border-b border-border last:border-0">
                        <Td>{c.assignedToName || c.collectedBy}</Td>
                        <Td muted>{new Date(c.dateCollected).toLocaleDateString()}</Td>
                        <Td muted>{c.dateReturned ? new Date(c.dateReturned).toLocaleDateString() : "—"}</Td>
                        <Td muted mono>{c.collectedBy}</Td>
                        <Td muted capitalize>{c.conditionOnReturn ?? c.conditionOnCollection}</Td>
                        <td className="px-4 py-3">
                          <StatusPill status={c.status === "returned" ? "returned" : (c.dueDate && new Date(c.dueDate) < new Date() ? "overdue" : "active")} />
                        </td>
                      </tr>
                    ))}
                  </Table>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="interactive-card border border-border rounded-xl overflow-hidden bg-surface overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-background text-left text-xs text-muted uppercase tracking-wide">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({
  children,
  muted,
  mono,
  capitalize,
}: {
  children: React.ReactNode;
  muted?: boolean;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3 ${muted ? "text-muted" : ""} ${mono ? "font-mono text-xs" : ""} ${
        capitalize ? "capitalize" : ""
      }`}
    >
      {children}
    </td>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="animate-enter border border-dashed border-border rounded-xl py-10 text-center">
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}
