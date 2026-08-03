"use client";

import { useState, useMemo } from "react";
import { Category, Item, Checkout } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { StatCard } from "./StatCard";
import { CheckoutDetailsModal } from "@/components/checkouts/CheckoutDetailsModal";
import { CategoryDetailsModal } from "@/components/categories/CategoryDetailsModal";
import { ItemDetailsModal } from "@/components/items/ItemDetailsModal";
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
  const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

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
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of everything in inventory" />

      <div className="px-4 md:px-8 pb-8 animate-enter">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Assigned" value={checkedOut.length} onClick={() => setTab("Overview")} />
          <StatCard label="Overdue" value={overdue.length} tone="danger" onClick={() => setTab("Overview")} />
          <StatCard label="Low stock" value={lowStock.length} tone="warning" onClick={() => setTab("Overview")} />
          <StatCard label="Total items" value={items.length} onClick={() => setTab("By category")} />
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
                <Table
                  headers={["Item", "Assigned to", "Since", "Due", "Status"]}
                  mobileCards={
                    <ul className="space-y-3">
                      {checkedOut.map(({ checkout, item }) => (
                        <li
                          key={checkout.id}
                          className="interactive-card rounded-xl border border-border bg-surface p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-foreground break-words">
                                {item?.name ?? "Unknown"}
                              </p>
                              <p className="text-xs text-muted mt-0.5 break-words">
                                {checkout.assignedToName || checkout.collectedBy}
                              </p>
                            </div>
                            <div className="shrink-0">
                              <StatusPill status={checkout.dueDate && new Date(checkout.dueDate) < new Date() ? "overdue" : "active"} />
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="min-w-0">
                              <p className="text-muted">Since</p>
                              <p className="text-foreground">{new Date(checkout.dateCollected).toLocaleDateString()}</p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-muted">Due</p>
                              <p className="text-foreground">{checkout.dueDate ? new Date(checkout.dueDate).toLocaleDateString() : "—"}</p>
                            </div>
                          </div>
                          {checkout.assignedToEmail && (
                            <p className="mt-2 text-xs text-muted font-mono break-words">
                              {checkout.assignedToEmail}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  }
                >
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
                <Table
                  headers={["Item", "Assigned to", "Due date", "Days overdue"]}
                  mobileCards={
                    <ul className="space-y-3">
                      {overdue.map(({ checkout, item }) => {
                        const daysOverdue = Math.floor(
                          (now - new Date(checkout.dueDate!).getTime()) / 86400000
                        );
                        return (
                          <li
                            key={checkout.id}
                            className="interactive-card cursor-pointer rounded-xl border border-border bg-surface p-4"
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedCheckout(checkout)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedCheckout(checkout);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-foreground break-words">
                                  {item?.name ?? "Unknown"}
                                </p>
                                <p className="text-xs text-muted mt-0.5 break-words">
                                  {checkout.assignedToName || checkout.collectedBy}
                                </p>
                              </div>
                              <div className="shrink-0 text-status-overdue font-semibold text-sm">
                                {daysOverdue}d
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div className="min-w-0">
                                <p className="text-muted">Due date</p>
                                <p className="text-foreground">{new Date(checkout.dueDate!).toLocaleDateString()}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted">Overdue</p>
                                <p className="text-status-overdue font-medium">{daysOverdue}d</p>
                              </div>
                            </div>
                            {checkout.assignedToEmail && (
                              <p className="mt-2 text-xs text-muted font-mono break-words">
                                {checkout.assignedToEmail}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  }
                >
                  {overdue.map(({ checkout, item }) => {
                    const daysOverdue = Math.floor(
                      (now - new Date(checkout.dueDate!).getTime()) / 86400000
                    );
                    return (
                      <tr
                        key={checkout.id}
                        className="table-row border-b border-border last:border-0 cursor-pointer hover:bg-accent-soft/70 text-foreground"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedCheckout(checkout)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedCheckout(checkout);
                          }
                        }}
                      >
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
                <Table
                  headers={["Item", "Category", "Remaining", "Threshold"]}
                  mobileCards={
                    <ul className="space-y-3">
                      {lowStock.map(({ item, category }) => (
                        <li
                          key={item.id}
                          className="interactive-card cursor-pointer rounded-xl border border-border bg-surface p-4"
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedItem(item)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedItem(item);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-foreground break-words">
                                {item.name}
                              </p>
                              <p className="text-xs text-muted mt-0.5 truncate">
                                {category?.name ?? "—"}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-lg font-semibold font-mono text-status-low-stock leading-none">
                                {item.quantity}
                              </p>
                              <p className="text-[10px] text-muted uppercase tracking-wide mt-1">
                                left
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 rounded-lg bg-background border border-border p-3 text-xs">
                            <p className="text-muted">Threshold</p>
                            <p className="text-foreground font-mono">
                              {category?.lowStockThreshold ?? "—"}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  }
                >
                  {lowStock.map(({ item, category }) => (
                    <tr
                      key={item.id}
                      className="table-row border-b border-border last:border-0 cursor-pointer hover:bg-accent-soft/70 text-foreground"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedItem(item)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedItem(item);
                        }
                      }}
                    >
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
          <Table
            headers={["Category", "Total items", "Assigned", "Available", "Low stock"]}
            mobileCards={
              <ul className="space-y-3">
                {breakdown.map(({ category, totalItems, checkedOut, available, lowStock }) => (
                  <li
                    key={category.id}
                    className="interactive-card cursor-pointer rounded-xl border border-border bg-surface p-4"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedCategory(category)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedCategory(category);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground break-words">
                          {category.name}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {totalItems} total {totalItems === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {lowStock > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-status-low-stock-bg px-2.5 py-1 text-xs font-medium text-status-low-stock">
                            {lowStock} low
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-background border border-border p-2">
                        <p className="text-sm font-semibold font-mono text-foreground">{checkedOut}</p>
                        <p className="text-[10px] text-muted uppercase tracking-wide mt-0.5">Assigned</p>
                      </div>
                      <div className="rounded-lg bg-background border border-border p-2">
                        <p className="text-sm font-semibold font-mono text-foreground">{available}</p>
                        <p className="text-[10px] text-muted uppercase tracking-wide mt-0.5">Available</p>
                      </div>
                      <div className="rounded-lg bg-background border border-border p-2">
                        <p className={`text-sm font-semibold font-mono ${lowStock > 0 ? "text-status-low-stock" : "text-muted"}`}>
                          {lowStock}
                        </p>
                        <p className="text-[10px] text-muted uppercase tracking-wide mt-0.5">Low stock</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            }
          >
            {breakdown.map(({ category, totalItems, checkedOut, available, lowStock }) => (
              <tr
                key={category.id}
                className="table-row border-b border-border last:border-0 cursor-pointer hover:bg-accent-soft/70 text-foreground"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedCategory(category)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedCategory(category);
                  }
                }}
              >
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
                  <Table
                    headers={["Item", "Assigned", "Returned", "Processed by", "Condition", "Status"]}
                    mobileCards={
                      <ul className="space-y-3">
                        {personHistory.map((c) => (
                          <li
                            key={c.id}
                            className="interactive-card cursor-pointer rounded-xl border border-border bg-surface p-4"
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedCheckout({ ...c, itemId: c.itemId } as Checkout)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedCheckout({ ...c, itemId: c.itemId } as Checkout);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-foreground break-words">
                                  {itemById.get(c.itemId)?.name ?? "Unknown"}
                                </p>
                                <p className="text-xs text-muted mt-0.5 truncate">
                                  Processed by {c.collectedBy}
                                </p>
                              </div>
                              <div className="shrink-0">
                                <StatusPill status={c.status === "returned" ? "returned" : (c.dueDate && new Date(c.dueDate) < new Date() ? "overdue" : "active")} />
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div className="min-w-0">
                                <p className="text-muted">Assigned</p>
                                <p className="text-foreground">{new Date(c.dateCollected).toLocaleDateString()}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted">Returned</p>
                                <p className="text-foreground">{c.dateReturned ? new Date(c.dateReturned).toLocaleDateString() : "—"}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted">Condition</p>
                                <p className="text-foreground capitalize">{c.conditionOnReturn ?? c.conditionOnCollection}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    }
                  >
                    {personHistory.map((c) => (
                      <tr
                        key={c.id}
                        className="table-row border-b border-border last:border-0 cursor-pointer hover:bg-accent-soft/70 text-foreground"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedCheckout({ ...c, itemId: c.itemId } as Checkout)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedCheckout({ ...c, itemId: c.itemId } as Checkout);
                          }
                        }}
                      >
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
                  <Table
                    headers={["Assigned to", "Assigned", "Returned", "Processed by", "Condition", "Status"]}
                    mobileCards={
                      <ul className="space-y-3">
                        {itemHistory.map((c) => (
                          <li
                            key={c.id}
                            className="interactive-card cursor-pointer rounded-xl border border-border bg-surface p-4"
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedCheckout(c)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedCheckout(c);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-foreground break-words">
                                  {c.assignedToName || c.collectedBy}
                                </p>
                                <p className="text-xs text-muted mt-0.5 truncate">
                                  Processed by {c.collectedBy}
                                </p>
                              </div>
                              <div className="shrink-0">
                                <StatusPill status={c.status === "returned" ? "returned" : (c.dueDate && new Date(c.dueDate) < new Date() ? "overdue" : "active")} />
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div className="min-w-0">
                                <p className="text-muted">Assigned</p>
                                <p className="text-foreground">{new Date(c.dateCollected).toLocaleDateString()}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted">Returned</p>
                                <p className="text-foreground">{c.dateReturned ? new Date(c.dateReturned).toLocaleDateString() : "—"}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted">Condition</p>
                                <p className="text-foreground capitalize">{c.conditionOnReturn ?? c.conditionOnCollection}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    }
                  >
                    {itemHistory.map((c) => (
                      <tr
                        key={c.id}
                        className="table-row border-b border-border last:border-0 cursor-pointer hover:bg-accent-soft/70 text-foreground"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedCheckout(c)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedCheckout(c);
                          }
                        }}
                      >
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

      {selectedCheckout && (() => {
        const selectedItemForCheckout = itemById.get(selectedCheckout.itemId) ?? null;
        const selectedCategoryForCheckout = selectedItemForCheckout?.categoryId
          ? categoryById.get(selectedItemForCheckout.categoryId) ?? null
          : null;

        return (
          <CheckoutDetailsModal
            checkout={selectedCheckout}
            item={selectedItemForCheckout}
            category={selectedCategoryForCheckout}
            onClose={() => setSelectedCheckout(null)}
          />
        );
      })()}

      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          category={categoryById.get(selectedItem.categoryId) ?? null}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {selectedCategory && (
        <CategoryDetailsModal
          category={selectedCategory}
          itemCount={items.filter((item) => item.categoryId === selectedCategory.id).length}
          onClose={() => setSelectedCategory(null)}
        />
      )}
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

function Table({
  headers,
  children,
  mobileCards,
}: {
  headers: string[];
  children: React.ReactNode;
  mobileCards?: React.ReactNode;
}) {
  return (
    <div className="space-y-3 md:space-y-0">
      {mobileCards && <div className="md:hidden space-y-3">{mobileCards}</div>}
      <div className="hidden md:block interactive-card border border-border rounded-xl overflow-hidden bg-surface overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
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
