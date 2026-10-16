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
  staffId?: string | null;
  phone?: string | null;
  department?: string | null;
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

export type ApprovalStatus = "pending" | "approved" | "rejected";

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
  registeredByStaff?: boolean;
  approvalStatus?: ApprovalStatus;
  createdBy: string;
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

export interface StaffDevice {
  checkoutId: string;
  itemId: string;
  name: string;
  categoryName: string;
  serialNumber: string | null;
  identifierType: ItemIdentifierType | null;
  identifierValue: string | null;
  condition: ItemCondition;
  dateCollected: string;
  dueDate: string | null;
  status: CheckoutStatus;
  activeComplaint?: {
    id: string;
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
  } | null;
}
