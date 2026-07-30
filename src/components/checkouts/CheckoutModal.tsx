"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Category, DepartmentUser, Item, ItemCondition } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { FormField, inputClass } from "@/components/ui/FormField";
import { getItemIdentifierLabel } from "@/lib/items";

export function CheckoutModal({
  items,
  categories,
  assigners,
  defaultAssignedBy,
  onClose,
}: {
  items: Item[];
  categories: Category[];
  assigners: DepartmentUser[];
  defaultAssignedBy: string;
  onClose: () => void;
}) {
  const router = useRouter();

  const availableItems = useMemo(
    () =>
      items.filter((i) => i.status !== "checked-out" && (i.quantity === null || i.quantity > 0)),
    [items]
  );

  const [itemId, setItemId] = useState(availableItems[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [assignedToName, setAssignedToName] = useState("");
  const [assignedToPhone, setAssignedToPhone] = useState("");
  const [assignedToEmail, setAssignedToEmail] = useState("");
  const [assignedBy, setAssignedBy] = useState(defaultAssignedBy ?? assigners[0]?.name ?? "");
  const [condition, setCondition] = useState<ItemCondition>("good");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const item = availableItems.find((i) => i.id === itemId);
  const category = categories.find((c) => c.id === item?.categoryId);
  const isQuantityTracked = category?.trackingType === "quantity";
  const requiresDueDate = category?.returnType === "fixed-date";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      itemId,
      quantity: isQuantityTracked ? Number(quantity) : null,
      collectedBy: assignedBy,
      assignedToName,
      assignedToPhone,
      assignedToEmail,
      conditionOnCollection: condition,
      collectionNotes: notes || null,
      dueDate: requiresDueDate && dueDate ? new Date(dueDate).toISOString() : null,
    };

    const response = await fetch("/api/checkouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Couldn't assign item. Try again.");
      setSaving(false);
      return;
    }

    router.refresh();
    onClose();
  }

  if (availableItems.length === 0) {
    return (
      <Modal title="Assign item" onClose={onClose}>
        <p className="text-sm text-muted">Nothing available to assign right now.</p>
      </Modal>
    );
  }

  return (
    <Modal title="Assign item" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Item">
          <select
            className={inputClass}
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
          >
            {availableItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} - {getItemIdentifierLabel(i)}
              </option>
            ))}
          </select>
        </FormField>

        {isQuantityTracked && (
          <FormField label={`Quantity (${item?.quantity ?? 0} in stock)`}>
            <input
              type="number"
              min="1"
              max={item?.quantity ?? undefined}
              className={inputClass}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </FormField>
        )}

        <FormField label="Recipient full name">
          <input
            className={inputClass}
            value={assignedToName}
            onChange={(e) => setAssignedToName(e.target.value)}
            placeholder="e.g. Amina Yusuf"
            required
          />
        </FormField>

        <FormField label="Recipient phone number">
          <input
            className={inputClass}
            value={assignedToPhone}
            onChange={(e) => setAssignedToPhone(e.target.value)}
            placeholder="e.g. +234 801 234 5678"
            required
          />
        </FormField>

        <FormField label="Recipient official email">
          <input
            type="email"
            className={inputClass}
            value={assignedToEmail}
            onChange={(e) => setAssignedToEmail(e.target.value)}
            placeholder="name@company.com"
            required
          />
        </FormField>

        <FormField label="Assigned by">
          <select
            className={inputClass}
            value={assignedBy}
            onChange={(e) => setAssignedBy(e.target.value)}
            required
          >
            <option value="" disabled>
              Select the assigning admin
            </option>
            {assigners.map((user) => (
              <option key={user.id} value={user.name}>
                {user.name} — {user.email}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Condition on collection">
          <select
            className={inputClass}
            value={condition}
            onChange={(e) => setCondition(e.target.value as ItemCondition)}
          >
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="damaged">Damaged</option>
          </select>
        </FormField>

        {requiresDueDate && (
          <FormField label="Due back by">
            <input
              type="date"
              className={inputClass}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </FormField>
        )}

        <FormField label="Notes (optional)">
          <textarea
            className={inputClass}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </FormField>

        {error && <p className="text-sm text-status-overdue mb-3">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="pressable w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "Assigning..." : "Assign item"}
        </button>
      </form>
    </Modal>
  );
}
