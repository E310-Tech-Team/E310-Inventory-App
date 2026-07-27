"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Item, Category, ItemCondition, ItemIdentifierType } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { FormField, inputClass } from "@/components/ui/FormField";
import { ITEM_IDENTIFIER_LABELS } from "@/lib/items";

export function ItemFormModal({
  item,
  categories,
  defaultCategoryId,
  onClose,
}: {
  item?: Item;
  categories: Category[];
  defaultCategoryId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = !!item;

  const [categoryId, setCategoryId] = useState(
    item?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? ""
  );
  const [name, setName] = useState(item?.name ?? "");
  const [identifierType, setIdentifierType] = useState<ItemIdentifierType>(
    item?.identifierType ?? "serial-number"
  );
  const [identifierValue, setIdentifierValue] = useState(
    item?.identifierValue ?? item?.serialNumber ?? ""
  );
  const [quantity, setQuantity] = useState(item?.quantity?.toString() ?? "");
  const [condition, setCondition] = useState<ItemCondition>(item?.condition ?? "new");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = categories.find((c) => c.id === categoryId);
  const isQuantityTracked = category?.trackingType === "quantity";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      categoryId,
      name,
      serialNumber:
        !isQuantityTracked && identifierType === "serial-number"
          ? identifierValue || null
          : null,
      identifierType: isQuantityTracked ? null : identifierType,
      identifierValue: isQuantityTracked ? null : identifierValue || null,
      quantity: isQuantityTracked ? Number(quantity) : null,
      condition,
      notes: notes || null,
    };

    const response = await fetch(isEdit ? `/api/items/${item.id}` : "/api/items", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setError("Couldn't save item. Try again.");
      setSaving(false);
      return;
    }

    router.refresh();
    onClose();
  }

  if (categories.length === 0) {
    return (
      <Modal title="New item" onClose={onClose}>
        <p className="text-sm text-muted">
          Create a category first before adding items.
        </p>
      </Modal>
    );
  }

  return (
    <Modal title={isEdit ? "Edit item" : "New item"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Category">
          <select
            className={inputClass}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={isEdit}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. MacBook Pro 14&quot;"
            required
          />
        </FormField>

        {isQuantityTracked ? (
          <FormField label="Quantity">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </FormField>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
            <FormField label="Identifier type">
              <select
                className={inputClass}
                value={identifierType}
                onChange={(e) => setIdentifierType(e.target.value as ItemIdentifierType)}
              >
                {Object.entries(ITEM_IDENTIFIER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Identifier value">
              <input
                className={`${inputClass} font-mono`}
                value={identifierValue}
                onChange={(e) => setIdentifierValue(e.target.value)}
                placeholder="e.g. C02FX1234ABC"
              />
            </FormField>
          </div>
        )}

        <FormField label="Condition">
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
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add item"}
        </button>
      </form>
    </Modal>
  );
}
