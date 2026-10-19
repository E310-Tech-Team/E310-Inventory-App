import {
  Category,
  DepartmentUser,
  Item,
  Checkout,
  DeviceComplaint,
  PortalOption,
  Notification,
  AuditLog,
} from "@/types";

export interface DataStore {
  // Users
  getUsers(): Promise<DepartmentUser[]>;
  getActiveUsers(): Promise<DepartmentUser[]>;
  getUser(id: string): Promise<DepartmentUser | null>;
  getUserByEmail(email: string): Promise<DepartmentUser | null>;
  createUser(data: Omit<DepartmentUser, "id" | "createdAt" | "updatedAt">): Promise<DepartmentUser>;
  updateUser(id: string, data: Partial<DepartmentUser>): Promise<DepartmentUser>;
  deleteUser(id: string): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | null>;
  createCategory(data: Omit<Category, "id" | "createdAt">): Promise<Category>;
  updateCategory(id: string, data: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Items
  getItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | null>;
  getItemsByCategory(categoryId: string): Promise<Item[]>;
  createItem(data: Omit<Item, "id" | "createdAt">): Promise<Item>;
  updateItem(id: string, data: Partial<Item>): Promise<Item>;
  deleteItem(id: string): Promise<void>;

  // Checkouts
  getCheckouts(): Promise<Checkout[]>;
  getCheckout(id: string): Promise<Checkout | null>;
  getCheckoutsByItem(itemId: string): Promise<Checkout[]>;
  getCheckoutsByAdmin(adminName: string): Promise<Checkout[]>;
  createCheckout(data: Omit<Checkout, "id">): Promise<Checkout>;
  updateCheckout(id: string, data: Partial<Checkout>): Promise<Checkout>;

  // Complaints
  getComplaints(): Promise<DeviceComplaint[]>;
  getComplaint(id: string): Promise<DeviceComplaint | null>;
  getComplaintsByUser(userId: string): Promise<DeviceComplaint[]>;
  createComplaint(data: Omit<DeviceComplaint, "id" | "createdAt" | "updatedAt">): Promise<DeviceComplaint>;
  updateComplaint(id: string, data: Partial<DeviceComplaint>): Promise<DeviceComplaint>;

  // Portal Options
  getPortalOptions(group?: string): Promise<PortalOption[]>;
  getPortalOption(id: string): Promise<PortalOption | null>;
  createPortalOption(data: Omit<PortalOption, "id" | "createdAt" | "updatedAt">): Promise<PortalOption>;
  updatePortalOption(id: string, data: Partial<PortalOption>): Promise<PortalOption>;
  deletePortalOption(id: string): Promise<void>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(data: Omit<Notification, "id" | "createdAt">): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;

  // Audit Logs
  createAuditLog(data: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog>;
  getRecentAuditLogs(limit?: number): Promise<AuditLog[]>;
}
