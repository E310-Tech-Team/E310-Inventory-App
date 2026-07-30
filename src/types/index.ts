export type TrackingType = "individual" | "quantity";
export type ReturnType = "fixed-date" | "open-ended";
export type ItemCondition = "new" | "good" | "fair" | "damaged";
export type ItemStatus = "available" | "checked-out" | "low-stock";
export type CheckoutStatus = "active" | "returned" | "overdue";
export type ItemIdentifierType =
  | "serial-number"
  | "asset-tag"
  | "service-tag"
  | "imei"
  | "model-number"
  | "other";
export type UserRole = "super-admin" | "team-member" | "viewer";
export type UserStatus = "active" | "inactive" | "pending";

export interface DepartmentUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string | null;
  role: UserRole;
  status: UserStatus;
  invitedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Admin = DepartmentUser;

export interface Category {
  id: string;
  name: string;
  trackingType: TrackingType;
  returnType: ReturnType;
  lowStockThreshold: number | null;
  createdBy: string;
  createdAt: string;
}

export interface Item {
  id: string;
  categoryId: string;
  name: string;
  serialNumber: string | null;
  identifierType: ItemIdentifierType | null;
  identifierValue: string | null;
  quantity: number | null;
  status: ItemStatus;
  condition: ItemCondition;
  notes: string | null;
  createdAt: string;
}

export interface Checkout {
  id: string;
  itemId: string;
  quantity: number | null;
  collectedBy: string;
  assignedToName: string;
  assignedToPhone: string;
  assignedToEmail: string;
  conditionOnCollection: ItemCondition;
  collectionNotes: string | null;
  dateCollected: string;
  dueDate: string | null;
  dateReturned: string | null;
  conditionOnReturn: ItemCondition | null;
  returnNotes: string | null;
  status: CheckoutStatus;
}

export interface CategoryWithStats extends Category {
  itemCount: number;
}

export interface ItemWithDetails extends Item {
  categoryName: string;
  activeCheckout: Checkout | null;
}
