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
export type DualPortalRole = "super-admin" | "tech-support" | "staff";
export type LegacyUserRole = "team-member" | "viewer";
export type UserRole = DualPortalRole | LegacyUserRole;
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

export type ComplaintStatus =
  | "submitted"
  | "under-review"
  | "in-repair"
  | "resolved"
  | "cancelled"
  | "pending"
  | "assigned"
  | "in-progress"
  | "waiting-parts"
  | "closed";

export type ComplaintSeverity = "low" | "medium" | "high" | "critical";
export type ComplaintPriority = ComplaintSeverity;

export interface DeviceComplaint {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userDepartment?: string | null;
  itemId?: string | null;
  itemName?: string | null;
  itemSerial?: string | null;
  deviceSummary?: string;
  title: string;
  description: string;
  issueType: string;
  severity?: ComplaintSeverity;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  attachmentUrls?: string[];
  assignedTechId?: string | null;
  assignedTechName?: string | null;
  techNotes?: string | null;
  resolutionNotes?: string | null;
  resolutionSummary?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalOption {
  id: string;
  categoryGroup: string;
  label: string;
  value: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export type NotificationType =
  | "complaint_logged"
  | "complaint_assigned"
  | "complaint_status_changed"
  | "device_registered"
  | "device_approved"
  | "system_alert";

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  notificationType: NotificationType;
  linkUrl?: string | null;
  isRead: boolean;
  emailSent: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  actorName: string;
  actionType: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

export type NotificationType =
  | "complaint_logged"
  | "complaint_assigned"
  | "complaint_status_changed"
  | "device_registered"
  | "device_approved"
  | "system_alert";

export interface InAppNotification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  notificationType: NotificationType;
  linkUrl: string | null;
  isRead: boolean;
  emailSent?: boolean;
  createdAt: string;
}

