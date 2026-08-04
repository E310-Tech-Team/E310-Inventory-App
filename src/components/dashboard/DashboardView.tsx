"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  PackageX,
  ClipboardList,
  Sparkles,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import { Category, Item, Checkout } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
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
  getRecentlyAddedView,
} from "@/lib/dashboard";

const TABS = ["At a glance", "By category", "History"] as const;
type Tab = (typeof TABS)[number];

type ExpandedCard = "overdue" | "low-stock" | "pending" | "recent" | null;

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
  const [tab, setTab] = useState<Tab>("At a glance");
  const [expandedCard, setExpandedCard] = useState<ExpandedCard>(null);
  const [historyMode, setHistoryMode] = useState<"item" | "person">("person");
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id ?? "");
  const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const checkedOut = useMemo(() => getCheckedOutView(checkouts, items), [checkouts, items]);
  const overdue = useMemo(() => getOverdueView(checkouts, items), [checkouts, items]);
  const lowStock = useMemo(() => getLowStockView(items, categories), [items, categories]);
  const recentlyAdded = useMemo(() => getRecentlyAddedView(items), [items]);
  const breakdown = useMemo(() => getCategoryBreakdown(items, categories), [items, categories]);

  const people = useMemo(() => {
    const names = new Set([
      ...checkouts.map((checkout) => checkout.assignedToName || checkout.collectedBy),
    ]);
    return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [checkouts]);
  const [selectedAdmin, setSelectedAdmin] = useState(people[0] ?? "");
  const activeSelectedAdmin = people.includes(selectedAdmin) ? selectedAdmin : people[0] ?? "";

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

  const cards: Array<{
    key: Exclude<ExpandedCard, null>;
    label: string;
    count: number;
    icon: React.ElementType;
    tone: "danger" | "warning" | "accent" | "default";
    expanded: boolean;
    onToggle: () => void;
  }> = [
    {
      key: "overdue",
      label: "Overdue",
      count: overdue.length,
      icon: AlertTriangle,
      tone: "danger",
      expanded: expandedCard === "overdue",
      onToggle: () => setExpandedCard(expandedCard === "overdue" ? null : "overdue"),
    },
    {
      key: "low-stock",
      label: "Low stock",
      count: lowStock.length,
      icon: PackageX,
      tone: "warning",
      expanded: expandedCard === "low-stock",
      onToggle: () => setExpandedCard(expandedCard === "low-stock" ? null : "low-stock"),
    },
    {
      key: "pending",
      label: "Pending requests",
      count: checkedOut.length,
      icon: ClipboardList,
      tone: "accent",
      expanded: expandedCard === "pending",
      onToggle: () => setExpandedCard(expandedCard === "pending" ? null : "pending"),
    },
    {
      key: "recent",
      label: "Recently added",
      count: recentlyAdded.length,
      icon: Sparkles,
      tone: "default",
      expanded: expandedCard === "recent",
      onToggle: () => setExpandedCard(expandedCard === "recent" ? null : "recent"),
    },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of everything in inventory" />

      <div className="px-4 md:px-8 pb-8">
        <div className="flex gap-1 mb-6 border-b border-border">
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

        {tab === "At a glance" && (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cards.map((card) => {
                const Icon = card.icon;
                const toneClass =
                  card.tone === "danger"
                    ? "text-status-overdue"
                    : card.tone === "warning"
                      ? "text-status-low-stock"
                      : card.tone === "accent"
                        ? "text-accent"
                        : "text-foreground";
                const iconBg =
                  card.tone === "danger"
                    ? "bg-status-overdue/10"
                    : card.tone === "warning"
                      ? "bg-status-low-stock/10"
                      : card.tone === "accent"
                        ? "bg-accent-soft/60"
                        : "bg-accent-soft/40";

                return (
                  <div
                    key={card.key}
                    className={`interactive-card relative rounded-2xl border border-border bg-surface p-6 transition-all duration-300 ${
                      card.expanded ? "sm:col-span-2" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                        >
                          <Icon className={`h-6 w-6 ${toneClass}`} strokeWidth={2} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted">{card.label}</p>
                          <p className={`text-4xl sm:text-5xl font-black tracking-tight ${toneClass}`}>
                            {card.count}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={card.onToggle}
                        className="pressable inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted hover:text-foreground"
                      >
                        View
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform duration-300 ${
                            card.expanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    <div
                      className={`grid transition-all duration-300 ease-out ${
                        card.expanded
                          ? "mt-4 grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="border-t border-border pt-4">
                          {card.key === "overdue" && (
                            <OverdueList
                              overdue={overdue}
                              now={now}
                              onSelect={(c) => setSelectedCheckout(c)}
                            />
                          )}
                          {card.key === "low-stock" && (
                            <LowStockList
                              lowStock={lowStock}
                              onSelect={(i) => setSelectedItem(i)}
                            />
                          )}
                          {card.key === "pending" && (
                            <PendingList
                              checkedOut={checkedOut}
                              onSelect={(c) => setSelectedCheckout(c)}
                            />
                          )}
                          {card.key === "recent" && (
                            <RecentList
                              recentlyAdded={recentlyAdded}
                              categoryById={categoryById}
                              onSelect={(i) => setSelectedItem(i)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
                      {lowStock > 0 && (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-status-low-stock-bg px-2.5 py-1 text-xs font-medium text-status-low-stock">
                          {lowStock} low
                        </span>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <MiniStat label="Assigned" value={checkedOut} />
                      <MiniStat label="Available" value={available} />
                      <MiniStat
                        label="Low stock"
                        value={lowStock}
                        tone={lowStock > 0 ? "text-status-low-stock" : "text-muted"}
                      />
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
                                <StatusPill
                                  status={
                                    c.status === "returned"
                                      ? "returned"
                                      : c.dueDate && new Date(c.dueDate) < new Date()
                                        ? "overdue"
                                        : "active"
                                  }
                                />
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div className="min-w-0">
                                <p className="text-muted">Assigned</p>
                                <p className="text-foreground">
                                  {new Date(c.dateCollected).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted">Returned</p>
                                <p className="text-foreground">
                                  {c.dateReturned ? new Date(c.dateReturned).toLocaleDateString() : "—"}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted">Condition</p>
                                <p className="text-foreground capitalize">
                                  {c.conditionOnReturn ?? c.conditionOnCollection}
                                </p>
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
                          <StatusPill
                            status={
                              c.status === "returned"
                                ? "returned"
                                : c.dueDate && new Date(c.dueDate) < new Date()
                                  ? "overdue"
                                  : "active"
                            }
                          />
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
                                <StatusPill
                                  status={
                                    c.status === "returned"
                                      ? "returned"
                                      : c.dueDate && new Date(c.dueDate) < new Date()
                                        ? "overdue"
                                        : "active"
                                  }
                                />
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div className="min-w-0">
                                <p className="text-muted">Assigned</p>
                                <p className="text-foreground">
                                  {new Date(c.dateCollected).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted">Returned</p>
                                <p className="text-foreground">
                                  {c.dateReturned ? new Date(c.dateReturned).toLocaleDateString() : "—"}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted">Condition</p>
                                <p className="text-foreground capitalize">
                                  {c.conditionOnReturn ?? c.conditionOnCollection}
                                </p>
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
                          <StatusPill
                            status={
                              c.status === "returned"
                                ? "returned"
                                : c.dueDate && new Date(c.dueDate) < new Date()
                                  ? "overdue"
                                  : "active"
                            }
                          />
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

function OverdueList({
  overdue,
  now,
  onSelect,
}: {
  overdue: ReturnType<typeof getOverdueView>;
  now: number;
  onSelect: (checkout: Checkout) => void;
}) {
  if (overdue.length === 0) {
    return <EmptyRow text="Nothing overdue. Good news." />;
  }
  return (
    <ul className="space-y-2">
      {overdue.map(({ checkout, item }) => {
        const daysOverdue = Math.floor((now - new Date(checkout.dueDate!).getTime()) / 86400000);
        return (
          <li key={checkout.id}>
            <ListButton
              onClick={() => onSelect(checkout)}
              title={item?.name ?? "Unknown"}
              subtitle={checkout.assignedToName || checkout.collectedBy}
              right={checkout.assignedToPhone || checkout.assignedToEmail}
              badge={`${daysOverdue}d overdue`}
              badgeClass="text-status-overdue"
            />
          </li>
        );
      })}
    </ul>
  );
}

function LowStockList({
  lowStock,
  onSelect,
}: {
  lowStock: ReturnType<typeof getLowStockView>;
  onSelect: (item: Item) => void;
}) {
  if (lowStock.length === 0) {
    return <EmptyRow text="All supplies are above threshold." />;
  }
  return (
    <ul className="space-y-2">
      {lowStock.map(({ item, category }) => (
        <li key={item.id}>
          <ListButton
            onClick={() => onSelect(item)}
            title={item.name}
            subtitle={category?.name ?? "—"}
            right={`${item.quantity} left`}
            badge="Low"
            badgeClass="text-status-low-stock"
          />
        </li>
      ))}
    </ul>
  );
}

function PendingList({
  checkedOut,
  onSelect,
}: {
  checkedOut: ReturnType<typeof getCheckedOutView>;
  onSelect: (checkout: Checkout) => void;
}) {
  if (checkedOut.length === 0) {
    return <EmptyRow text="Nothing assigned right now." />;
  }
  return (
    <ul className="space-y-2">
      {checkedOut.map(({ checkout, item }) => (
        <li key={checkout.id}>
          <ListButton
            onClick={() => onSelect(checkout)}
            title={item?.name ?? "Unknown"}
            subtitle={checkout.assignedToName || checkout.collectedBy}
            right={
              checkout.dueDate ? new Date(checkout.dueDate).toLocaleDateString() : "No due date"
            }
            badge="Active"
            badgeClass="text-accent"
          />
        </li>
      ))}
    </ul>
  );
}

function RecentList({
  recentlyAdded,
  categoryById,
  onSelect,
}: {
  recentlyAdded: Item[];
  categoryById: Map<string, Category>;
  onSelect: (item: Item) => void;
}) {
  if (recentlyAdded.length === 0) {
    return <EmptyRow text="No items added in the last 30 days." />;
  }
  return (
    <ul className="space-y-2">
      {recentlyAdded.map((item) => (
        <li key={item.id}>
          <ListButton
            onClick={() => onSelect(item)}
            title={item.name}
            subtitle={categoryById.get(item.categoryId)?.name ?? "—"}
            right={new Date(item.createdAt).toLocaleDateString()}
            badge="New"
            badgeClass="text-accent"
          />
        </li>
      ))}
    </ul>
  );
}

function ListButton({
  title,
  subtitle,
  right,
  badge,
  badgeClass,
  onClick,
}: {
  title: string;
  subtitle?: string;
  right?: string;
  badge?: string;
  badgeClass?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-accent/40 hover:bg-accent-soft/30"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {badge && <span className={`text-xs font-semibold ${badgeClass}`}>{badge}</span>}
        {right && <span className="hidden sm:inline text-xs text-muted">{right}</span>}
        <ArrowUpRight className="h-4 w-4 text-muted" />
      </div>
    </button>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg bg-background border border-border p-2">
      <p className={`text-sm font-semibold font-mono ${tone ?? "text-foreground"}`}>{value}</p>
      <p className="text-[10px] text-muted uppercase tracking-wide mt-0.5">{label}</p>
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
    <div className="animate-enter border border-dashed border-border rounded-xl py-8 text-center">
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}
