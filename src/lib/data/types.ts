import { Category, DepartmentUser, Item, Checkout } from "@/types";

export interface DataStore {
  getUsers(): Promise<DepartmentUser[]>;
  getActiveUsers(): Promise<DepartmentUser[]>;
  getUser(id: string): Promise<DepartmentUser | null>;
  getUserByEmail(email: string): Promise<DepartmentUser | null>;
  createUser(data: Omit<DepartmentUser, "id" | "createdAt" | "updatedAt">): Promise<DepartmentUser>;
  updateUser(id: string, data: Partial<DepartmentUser>): Promise<DepartmentUser>;
  deleteUser(id: string): Promise<void>;

  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | null>;
  createCategory(data: Omit<Category, "id" | "createdAt">): Promise<Category>;
  updateCategory(id: string, data: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  getItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | null>;
  getItemsByCategory(categoryId: string): Promise<Item[]>;
  createItem(data: Omit<Item, "id" | "createdAt">): Promise<Item>;
  updateItem(id: string, data: Partial<Item>): Promise<Item>;
  deleteItem(id: string): Promise<void>;

  getCheckouts(): Promise<Checkout[]>;
  getCheckout(id: string): Promise<Checkout | null>;
  getCheckoutsByItem(itemId: string): Promise<Checkout[]>;
  getCheckoutsByAdmin(adminName: string): Promise<Checkout[]>;
  createCheckout(data: Omit<Checkout, "id">): Promise<Checkout>;
  updateCheckout(id: string, data: Partial<Checkout>): Promise<Checkout>;
}
