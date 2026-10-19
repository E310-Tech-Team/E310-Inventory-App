import {
  AuditLog,
  Category,
  Checkout,
  ComplaintPriority,
  ComplaintSeverity,
  DepartmentUser,
  DeviceComplaint,
  Item,
  Notification,
  PortalOption,
} from "@/types";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { DataStore } from "./types";

interface DepartmentUserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  role: DepartmentUser["role"];
  status: DepartmentUser["status"];
  invited_by: string | null;
  staff_id: string | null;
  phone: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
}

interface CategoryRow {
  id: string;
  name: string;
  tracking_type: Category["trackingType"];
  return_type: Category["returnType"];
  low_stock_threshold: number | null;
  created_by: string;
  created_at: string;
}

interface ItemRow {
  id: string;
  category_id: string;
  name: string;
  serial_number: string | null;
  identifier_type: Item["identifierType"];
  identifier_value: string | null;
  quantity: number | null;
  status: Item["status"];
  condition: Item["condition"];
  notes: string | null;
  registered_by_staff?: boolean;
  approval_status?: Item["approvalStatus"];
  created_by: string | null;
  created_at: string;
}

interface CheckoutRow {
  id: string;
  item_id: string;
  quantity: number | null;
  collected_by: string;
  assigned_to_name: string | null;
  assigned_to_phone: string | null;
  assigned_to_email: string | null;
  condition_on_collection: Checkout["conditionOnCollection"];
  collection_notes: string | null;
  date_collected: string;
  due_date: string | null;
  date_returned: string | null;
  condition_on_return: Checkout["conditionOnReturn"];
  return_notes: string | null;
  status: Checkout["status"];
}

interface ComplaintRow {
  id: string;
  ticket_number: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  user_department?: string | null;
  item_id: string | null;
  device_summary?: string | null;
  title: string;
  description: string;
  issue_type: string;
  severity?: string | null;
  priority?: string | null;
  status: DeviceComplaint["status"];
  attachment_urls: string[] | null;
  assigned_tech_id: string | null;
  assigned_tech_name?: string | null;
  tech_notes?: string | null;
  resolution_notes?: string | null;
  resolution_summary?: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PortalOptionRow {
  id: string;
  category_group: string;
  label: string;
  value: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface NotificationRow {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  notification_type: Notification["notificationType"];
  link_url: string | null;
  is_read: boolean;
  email_sent: boolean;
  created_at: string;
}

interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

function throwOnError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function fromUserRow(row: DepartmentUserRow): DepartmentUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    status: row.status,
    invitedBy: row.invited_by,
    staffId: row.staff_id,
    phone: row.phone,
    department: row.department,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toUserInsertRow(
  data: Omit<DepartmentUser, "id" | "createdAt" | "updatedAt">
): Omit<DepartmentUserRow, "id" | "created_at" | "updated_at"> {
  return {
    name: data.name,
    email: data.email.toLowerCase(),
    password_hash: data.passwordHash ?? null,
    role: data.role,
    status: data.status,
    invited_by: data.invitedBy,
    staff_id: data.staffId ?? null,
    phone: data.phone ?? null,
    department: data.department ?? null,
  };
}

function toUserUpdateRow(data: Partial<DepartmentUser>): Partial<DepartmentUserRow> {
  return {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
    ...(data.role !== undefined ? { role: data.role } : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
    ...(data.passwordHash !== undefined ? { password_hash: data.passwordHash } : {}),
    ...(data.invitedBy !== undefined ? { invited_by: data.invitedBy } : {}),
    ...(data.staffId !== undefined ? { staff_id: data.staffId } : {}),
    ...(data.phone !== undefined ? { phone: data.phone } : {}),
    ...(data.department !== undefined ? { department: data.department } : {}),
    updated_at: new Date().toISOString(),
  };
}

function fromCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    trackingType: row.tracking_type,
    returnType: row.return_type,
    lowStockThreshold: row.low_stock_threshold,
    createdBy: row.created_by === "Google Sheet Import" ? "Goodness" : row.created_by,
    createdAt: row.created_at,
  };
}

function toCategoryInsertRow(
  data: Omit<Category, "id" | "createdAt">
): Omit<CategoryRow, "id" | "created_at"> {
  return {
    name: data.name,
    tracking_type: data.trackingType,
    return_type: data.returnType,
    low_stock_threshold: data.lowStockThreshold,
    created_by: data.createdBy,
  };
}

function toCategoryUpdateRow(data: Partial<Category>): Partial<CategoryRow> {
  return {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.trackingType !== undefined ? { tracking_type: data.trackingType } : {}),
    ...(data.returnType !== undefined ? { return_type: data.returnType } : {}),
    ...(data.lowStockThreshold !== undefined
      ? { low_stock_threshold: data.lowStockThreshold }
      : {}),
    ...(data.createdBy !== undefined ? { created_by: data.createdBy } : {}),
  };
}

function fromItemRow(row: ItemRow): Item {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    serialNumber: row.serial_number,
    identifierType: row.identifier_type ?? (row.serial_number ? "serial-number" : null),
    identifierValue: row.identifier_value ?? row.serial_number,
    quantity: row.quantity,
    status: row.status,
    condition: row.condition,
    notes: row.notes,
    registeredByStaff: row.registered_by_staff ?? false,
    approvalStatus: row.approval_status ?? "approved",
    createdBy: row.created_by ?? "",
    createdAt: row.created_at,
  };
}

function toItemInsertRow(data: Omit<Item, "id" | "createdAt">): Omit<ItemRow, "id" | "created_at"> {
  return {
    category_id: data.categoryId,
    name: data.name,
    serial_number: data.serialNumber,
    identifier_type: data.identifierType,
    identifier_value: data.identifierValue,
    quantity: data.quantity,
    status: data.status,
    condition: data.condition,
    notes: data.notes,
    registered_by_staff: data.registeredByStaff ?? false,
    approval_status: data.approvalStatus ?? "approved",
    created_by: data.createdBy,
  };
}

function toItemUpdateRow(data: Partial<Item>): Partial<ItemRow> {
  return {
    ...(data.categoryId !== undefined ? { category_id: data.categoryId } : {}),
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.serialNumber !== undefined ? { serial_number: data.serialNumber } : {}),
    ...(data.identifierType !== undefined ? { identifier_type: data.identifierType } : {}),
    ...(data.identifierValue !== undefined ? { identifier_value: data.identifierValue } : {}),
    ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
    ...(data.condition !== undefined ? { condition: data.condition } : {}),
    ...(data.notes !== undefined ? { notes: data.notes } : {}),
    ...(data.registeredByStaff !== undefined ? { registered_by_staff: data.registeredByStaff } : {}),
    ...(data.approvalStatus !== undefined ? { approval_status: data.approvalStatus } : {}),
    ...(data.createdBy !== undefined ? { created_by: data.createdBy } : {}),
  };
}

function fromCheckoutRow(row: CheckoutRow): Checkout {
  return {
    id: row.id,
    itemId: row.item_id,
    quantity: row.quantity,
    collectedBy: row.collected_by,
    assignedToName: row.assigned_to_name ?? row.collected_by,
    assignedToPhone: row.assigned_to_phone ?? "",
    assignedToEmail: row.assigned_to_email ?? "",
    conditionOnCollection: row.condition_on_collection,
    collectionNotes: row.collection_notes,
    dateCollected: row.date_collected,
    dueDate: row.due_date,
    dateReturned: row.date_returned,
    conditionOnReturn: row.condition_on_return,
    returnNotes: row.return_notes,
    status: row.status,
  };
}

function toCheckoutInsertRow(data: Omit<Checkout, "id">): Omit<CheckoutRow, "id"> {
  return {
    item_id: data.itemId,
    quantity: data.quantity,
    collected_by: data.collectedBy,
    assigned_to_name: data.assignedToName,
    assigned_to_phone: data.assignedToPhone,
    assigned_to_email: data.assignedToEmail,
    condition_on_collection: data.conditionOnCollection,
    collection_notes: data.collectionNotes,
    date_collected: data.dateCollected,
    due_date: data.dueDate,
    date_returned: data.dateReturned,
    condition_on_return: data.conditionOnReturn,
    return_notes: data.returnNotes,
    status: data.status,
  };
}

function toCheckoutUpdateRow(data: Partial<Checkout>): Partial<CheckoutRow> {
  return {
    ...(data.itemId !== undefined ? { item_id: data.itemId } : {}),
    ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
    ...(data.collectedBy !== undefined ? { collected_by: data.collectedBy } : {}),
    ...(data.assignedToName !== undefined ? { assigned_to_name: data.assignedToName } : {}),
    ...(data.assignedToPhone !== undefined ? { assigned_to_phone: data.assignedToPhone } : {}),
    ...(data.assignedToEmail !== undefined ? { assigned_to_email: data.assignedToEmail } : {}),
    ...(data.conditionOnCollection !== undefined
      ? { condition_on_collection: data.conditionOnCollection }
      : {}),
    ...(data.collectionNotes !== undefined ? { collection_notes: data.collectionNotes } : {}),
    ...(data.dateCollected !== undefined ? { date_collected: data.dateCollected } : {}),
    ...(data.dueDate !== undefined ? { due_date: data.dueDate } : {}),
    ...(data.dateReturned !== undefined ? { date_returned: data.dateReturned } : {}),
    ...(data.conditionOnReturn !== undefined
      ? { condition_on_return: data.conditionOnReturn }
      : {}),
    ...(data.returnNotes !== undefined ? { return_notes: data.returnNotes } : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
  };
}

function fromComplaintRow(row: ComplaintRow): DeviceComplaint {
  const priority = (row.severity || row.priority || "medium") as ComplaintPriority;
  return {
    id: row.id,
    ticketNumber: row.ticket_number || "",
    userId: row.user_id,
    userName: row.user_name || "Unknown User",
    userEmail: row.user_email || "",
    userDepartment: row.user_department ?? null,
    itemId: row.item_id,
    deviceSummary: row.device_summary ?? undefined,
    title: row.title,
    description: row.description,
    issueType: row.issue_type,
    severity: (row.severity || priority) as ComplaintSeverity,
    priority: priority,
    status: row.status,
    attachmentUrls: row.attachment_urls ?? [],
    assignedTechId: row.assigned_tech_id,
    assignedTechName: row.assigned_tech_name ?? null,
    techNotes: row.tech_notes ?? null,
    resolutionNotes: row.resolution_notes ?? row.resolution_summary ?? null,
    resolutionSummary: row.resolution_summary ?? row.resolution_notes ?? null,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toComplaintInsertRow(
  data: Omit<DeviceComplaint, "id" | "createdAt" | "updatedAt">
): Record<string, unknown> {
  const priority = data.severity || data.priority || "medium";
  const row: Record<string, unknown> = {
    user_id: data.userId,
    item_id: data.itemId ?? null,
    device_summary: data.deviceSummary?.trim() || `${data.title} (${data.issueType})`,
    title: data.title.trim(),
    description: data.description.trim(),
    issue_type: data.issueType.trim(),
    severity: data.severity ?? priority,
    priority: priority,
    status: data.status || "submitted",
    attachment_urls: data.attachmentUrls ?? [],
    assigned_tech_id: data.assignedTechId ?? null,
    resolution_notes: data.resolutionNotes ?? data.resolutionSummary ?? null,
    resolved_at: data.resolvedAt ?? null,
  };
  if (data.ticketNumber) row.ticket_number = data.ticketNumber;
  if (data.userName) row.user_name = data.userName;
  if (data.userEmail) row.user_email = data.userEmail.toLowerCase();
  if (data.userDepartment) row.user_department = data.userDepartment;
  if (data.techNotes) row.tech_notes = data.techNotes;
  if (data.resolutionSummary) row.resolution_summary = data.resolutionSummary;
  return row;
}

function toComplaintUpdateRow(data: Partial<DeviceComplaint>): Record<string, unknown> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (data.ticketNumber !== undefined) row.ticket_number = data.ticketNumber;
  if (data.userId !== undefined) row.user_id = data.userId;
  if (data.itemId !== undefined) row.item_id = data.itemId;
  if (data.deviceSummary !== undefined) row.device_summary = data.deviceSummary;
  if (data.title !== undefined) row.title = data.title.trim();
  if (data.description !== undefined) row.description = data.description.trim();
  if (data.issueType !== undefined) row.issue_type = data.issueType.trim();
  if (data.severity !== undefined) row.severity = data.severity;
  if (data.priority !== undefined) row.priority = data.priority;
  if (data.status !== undefined) row.status = data.status;
  if (data.attachmentUrls !== undefined) row.attachment_urls = data.attachmentUrls;
  if (data.assignedTechId !== undefined) row.assigned_tech_id = data.assignedTechId;
  if (data.userName !== undefined) row.user_name = data.userName;
  if (data.userEmail !== undefined) row.user_email = data.userEmail ? data.userEmail.toLowerCase() : null;
  if (data.userDepartment !== undefined) row.user_department = data.userDepartment;
  if (data.techNotes !== undefined) row.tech_notes = data.techNotes;
  if (data.resolutionNotes !== undefined) row.resolution_notes = data.resolutionNotes;
  if (data.resolutionSummary !== undefined) row.resolution_summary = data.resolutionSummary;
  if (data.resolvedAt !== undefined) row.resolved_at = data.resolvedAt;
  return row;
}

function fromPortalOptionRow(row: PortalOptionRow): PortalOption {
  return {
    id: row.id,
    categoryGroup: row.category_group,
    label: row.label,
    value: row.value,
    isActive: row.is_active,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPortalOptionInsertRow(
  data: Omit<PortalOption, "id" | "createdAt" | "updatedAt">
): Omit<PortalOptionRow, "id" | "created_at" | "updated_at"> {
  return {
    category_group: data.categoryGroup.trim(),
    label: data.label.trim(),
    value: data.value.trim(),
    is_active: data.isActive ?? true,
    display_order: data.displayOrder ?? 0,
  };
}

function toPortalOptionUpdateRow(data: Partial<PortalOption>): Partial<PortalOptionRow> {
  return {
    ...(data.categoryGroup !== undefined ? { category_group: data.categoryGroup.trim() } : {}),
    ...(data.label !== undefined ? { label: data.label.trim() } : {}),
    ...(data.value !== undefined ? { value: data.value.trim() } : {}),
    ...(data.isActive !== undefined ? { is_active: data.isActive } : {}),
    ...(data.displayOrder !== undefined ? { display_order: data.displayOrder } : {}),
    updated_at: new Date().toISOString(),
  };
}

function fromNotificationRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    title: row.title,
    message: row.message,
    notificationType: row.notification_type,
    linkUrl: row.link_url,
    isRead: row.is_read,
    emailSent: row.email_sent,
    createdAt: row.created_at,
  };
}

function toNotificationInsertRow(
  data: Omit<Notification, "id" | "createdAt">
): Omit<NotificationRow, "id" | "created_at"> {
  return {
    recipient_id: data.recipientId,
    title: data.title.trim(),
    message: data.message.trim(),
    notification_type: data.notificationType,
    link_url: data.linkUrl ?? null,
    is_read: data.isRead ?? false,
    email_sent: data.emailSent ?? false,
  };
}

function fromAuditLogRow(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    actionType: row.action_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: row.details ?? null,
    createdAt: row.created_at,
  };
}

function toAuditLogInsertRow(
  data: Omit<AuditLog, "id" | "createdAt">
): Omit<AuditLogRow, "id" | "created_at"> {
  return {
    actor_id: data.actorId ?? null,
    actor_name: data.actorName.trim(),
    action_type: data.actionType.trim(),
    entity_type: data.entityType.trim(),
    entity_id: data.entityId,
    details: data.details ?? {},
  };
}

export class SupabaseStore implements DataStore {
  private get supabase() {
    return getSupabaseAdminClient();
  }

  async getUsers(): Promise<DepartmentUser[]> {
    const { data, error } = await this.supabase
      .from("department_users")
      .select("*")
      .order("created_at", { ascending: true });
    throwOnError(error);
    return ((data ?? []) as DepartmentUserRow[]).map(fromUserRow);
  }

  async getActiveUsers(): Promise<DepartmentUser[]> {
    const { data, error } = await this.supabase
      .from("department_users")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: true });
    throwOnError(error);
    return ((data ?? []) as DepartmentUserRow[]).map(fromUserRow);
  }

  async getUser(id: string): Promise<DepartmentUser | null> {
    const { data, error } = await this.supabase
      .from("department_users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    throwOnError(error);
    return data ? fromUserRow(data as DepartmentUserRow) : null;
  }

  async getUserByEmail(email: string): Promise<DepartmentUser | null> {
    const { data, error } = await this.supabase
      .from("department_users")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    throwOnError(error);
    return data ? fromUserRow(data as DepartmentUserRow) : null;
  }

  async createUser(
    data: Omit<DepartmentUser, "id" | "createdAt" | "updatedAt">
  ): Promise<DepartmentUser> {
    const response = await this.supabase
      .from("department_users")
      .insert(toUserInsertRow(data))
      .select("*")
      .single();
    throwOnError(response.error);
    return fromUserRow(response.data as DepartmentUserRow);
  }

  async updateUser(id: string, data: Partial<DepartmentUser>): Promise<DepartmentUser> {
    const response = await this.supabase
      .from("department_users")
      .update(toUserUpdateRow(data))
      .eq("id", id)
      .select("*")
      .single();
    throwOnError(response.error);
    return fromUserRow(response.data as DepartmentUserRow);
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await this.supabase.from("department_users").delete().eq("id", id);
    throwOnError(error);
  }

  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });
    throwOnError(error);
    return ((data ?? []) as CategoryRow[]).map(fromCategoryRow);
  }

  async getCategory(id: string): Promise<Category | null> {
    const { data, error } = await this.supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    throwOnError(error);
    return data ? fromCategoryRow(data as CategoryRow) : null;
  }

  async createCategory(data: Omit<Category, "id" | "createdAt">): Promise<Category> {
    const response = await this.supabase
      .from("categories")
      .insert(toCategoryInsertRow(data))
      .select("*")
      .single();
    throwOnError(response.error);
    return fromCategoryRow(response.data as CategoryRow);
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const response = await this.supabase
      .from("categories")
      .update(toCategoryUpdateRow(data))
      .eq("id", id)
      .select("*")
      .single();
    throwOnError(response.error);
    return fromCategoryRow(response.data as CategoryRow);
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase.from("categories").delete().eq("id", id);
    throwOnError(error);
  }

  async getItems(): Promise<Item[]> {
    const { data, error } = await this.supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: true });
    throwOnError(error);
    return ((data ?? []) as ItemRow[]).map(fromItemRow);
  }

  async getItem(id: string): Promise<Item | null> {
    const { data, error } = await this.supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    throwOnError(error);
    return data ? fromItemRow(data as ItemRow) : null;
  }

  async getItemsByCategory(categoryId: string): Promise<Item[]> {
    const { data, error } = await this.supabase
      .from("items")
      .select("*")
      .eq("category_id", categoryId)
      .order("created_at", { ascending: true });
    throwOnError(error);
    return ((data ?? []) as ItemRow[]).map(fromItemRow);
  }

  async createItem(data: Omit<Item, "id" | "createdAt">): Promise<Item> {
    const response = await this.supabase
      .from("items")
      .insert(toItemInsertRow(data))
      .select("*")
      .single();
    throwOnError(response.error);
    return fromItemRow(response.data as ItemRow);
  }

  async updateItem(id: string, data: Partial<Item>): Promise<Item> {
    const response = await this.supabase
      .from("items")
      .update(toItemUpdateRow(data))
      .eq("id", id)
      .select("*")
      .single();
    throwOnError(response.error);
    return fromItemRow(response.data as ItemRow);
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await this.supabase.from("items").delete().eq("id", id);
    throwOnError(error);
  }

  async getCheckouts(): Promise<Checkout[]> {
    const { data, error } = await this.supabase
      .from("checkouts")
      .select("*")
      .order("date_collected", { ascending: false });
    throwOnError(error);
    return ((data ?? []) as CheckoutRow[]).map(fromCheckoutRow);
  }

  async getCheckout(id: string): Promise<Checkout | null> {
    const { data, error } = await this.supabase
      .from("checkouts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    throwOnError(error);
    return data ? fromCheckoutRow(data as CheckoutRow) : null;
  }

  async getCheckoutsByItem(itemId: string): Promise<Checkout[]> {
    const { data, error } = await this.supabase
      .from("checkouts")
      .select("*")
      .eq("item_id", itemId)
      .order("date_collected", { ascending: false });
    throwOnError(error);
    return ((data ?? []) as CheckoutRow[]).map(fromCheckoutRow);
  }

  async getCheckoutsByAdmin(adminName: string): Promise<Checkout[]> {
    const { data, error } = await this.supabase
      .from("checkouts")
      .select("*")
      .eq("collected_by", adminName)
      .order("date_collected", { ascending: false });
    throwOnError(error);
    return ((data ?? []) as CheckoutRow[]).map(fromCheckoutRow);
  }

  async createCheckout(data: Omit<Checkout, "id">): Promise<Checkout> {
    const response = await this.supabase
      .from("checkouts")
      .insert(toCheckoutInsertRow(data))
      .select("*")
      .single();
    throwOnError(response.error);
    return fromCheckoutRow(response.data as CheckoutRow);
  }

  async updateCheckout(id: string, data: Partial<Checkout>): Promise<Checkout> {
    const response = await this.supabase
      .from("checkouts")
      .update(toCheckoutUpdateRow(data))
      .eq("id", id)
      .select("*")
      .single();
    throwOnError(response.error);
    return fromCheckoutRow(response.data as CheckoutRow);
  }

  // Complaints
  async getComplaints(): Promise<DeviceComplaint[]> {
    const { data, error } = await this.supabase
      .from("device_complaints")
      .select("*")
      .order("created_at", { ascending: false });
    throwOnError(error);
    return ((data ?? []) as ComplaintRow[]).map(fromComplaintRow);
  }

  async getComplaint(id: string): Promise<DeviceComplaint | null> {
    const { data, error } = await this.supabase
      .from("device_complaints")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    throwOnError(error);
    return data ? fromComplaintRow(data as ComplaintRow) : null;
  }

  async getComplaintsByUser(userId: string): Promise<DeviceComplaint[]> {
    const { data, error } = await this.supabase
      .from("device_complaints")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    throwOnError(error);
    return ((data ?? []) as ComplaintRow[]).map(fromComplaintRow);
  }

  async createComplaint(
    data: Omit<DeviceComplaint, "id" | "createdAt" | "updatedAt">
  ): Promise<DeviceComplaint> {
    const response = await this.supabase
      .from("device_complaints")
      .insert(toComplaintInsertRow(data))
      .select("*")
      .single();
    throwOnError(response.error);
    return fromComplaintRow(response.data as ComplaintRow);
  }

  async updateComplaint(
    id: string,
    data: Partial<DeviceComplaint>
  ): Promise<DeviceComplaint> {
    const response = await this.supabase
      .from("device_complaints")
      .update(toComplaintUpdateRow(data))
      .eq("id", id)
      .select("*")
      .single();
    throwOnError(response.error);
    return fromComplaintRow(response.data as ComplaintRow);
  }

  // Portal Options
  async getPortalOptions(group?: string): Promise<PortalOption[]> {
    let query = this.supabase
      .from("portal_options")
      .select("*")
      .order("category_group", { ascending: true })
      .order("display_order", { ascending: true })
      .order("label", { ascending: true });

    if (group && group.trim() !== "" && group.trim() !== "all") {
      query = query.eq("category_group", group.trim());
    }

    const { data, error } = await query;
    throwOnError(error);
    return ((data ?? []) as PortalOptionRow[]).map(fromPortalOptionRow);
  }

  async getPortalOption(id: string): Promise<PortalOption | null> {
    const { data, error } = await this.supabase
      .from("portal_options")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    throwOnError(error);
    return data ? fromPortalOptionRow(data as PortalOptionRow) : null;
  }

  async createPortalOption(
    data: Omit<PortalOption, "id" | "createdAt" | "updatedAt">
  ): Promise<PortalOption> {
    const response = await this.supabase
      .from("portal_options")
      .insert(toPortalOptionInsertRow(data))
      .select("*")
      .single();
    throwOnError(response.error);
    return fromPortalOptionRow(response.data as PortalOptionRow);
  }

  async updatePortalOption(
    id: string,
    data: Partial<PortalOption>
  ): Promise<PortalOption> {
    const response = await this.supabase
      .from("portal_options")
      .update(toPortalOptionUpdateRow(data))
      .eq("id", id)
      .select("*")
      .single();
    throwOnError(response.error);
    return fromPortalOptionRow(response.data as PortalOptionRow);
  }

  async deletePortalOption(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("portal_options")
      .delete()
      .eq("id", id);
    throwOnError(error);
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false });
    throwOnError(error);
    return ((data ?? []) as NotificationRow[]).map(fromNotificationRow);
  }

  async createNotification(
    data: Omit<Notification, "id" | "createdAt">
  ): Promise<Notification> {
    const response = await this.supabase
      .from("notifications")
      .insert(toNotificationInsertRow(data))
      .select("*")
      .single();
    throwOnError(response.error);
    return fromNotificationRow(response.data as NotificationRow);
  }

  async markNotificationRead(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    throwOnError(error);
  }

  // Audit Logs
  async createAuditLog(
    data: Omit<AuditLog, "id" | "createdAt">
  ): Promise<AuditLog> {
    const response = await this.supabase
      .from("audit_logs")
      .insert(toAuditLogInsertRow(data))
      .select("*")
      .single();
    throwOnError(response.error);
    return fromAuditLogRow(response.data as AuditLogRow);
  }

  async getRecentAuditLogs(limit: number = 30): Promise<AuditLog[]> {
    const { data, error } = await this.supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    throwOnError(error);
    return ((data ?? []) as AuditLogRow[]).map(fromAuditLogRow);
  }
}
