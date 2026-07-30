import { Category, Checkout, DepartmentUser, Item } from "@/types";
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

function throwOnError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function fromUserRow(row: DepartmentUserRow): DepartmentUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    invitedBy: row.invited_by,
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
  };
}

function toUserUpdateRow(data: Partial<DepartmentUser>): Partial<DepartmentUserRow> {
  return {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
    ...(data.role !== undefined ? { role: data.role } : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
    ...(data.invitedBy !== undefined ? { invited_by: data.invitedBy } : {}),
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
    createdBy: row.created_by,
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
}
