import { Item, ItemIdentifierType } from "@/types";

export const ITEM_IDENTIFIER_LABELS: Record<ItemIdentifierType, string> = {
  "serial-number": "Serial number",
  "asset-tag": "Asset tag",
  "service-tag": "Service tag",
  imei: "IMEI",
  "model-number": "Model number",
  other: "Other detail",
};

export function getItemIdentifierLabel(item: Item): string {
  const value = item.identifierValue ?? item.serialNumber;
  if (!value) return "-";

  const type = item.identifierType ?? "serial-number";
  return `${ITEM_IDENTIFIER_LABELS[type]}: ${value}`;
}
