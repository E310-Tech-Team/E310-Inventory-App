import fs from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";
import { Category, DepartmentUser, Item, Checkout } from "@/types";
import { DataStore } from "./types";

const DB_PATH = path.join(process.cwd(), "src/mock-data-store/db.json");
const SEED_PATH = path.join(process.cwd(), "src/mock-data-store/seed.json");

interface Db {
  users: DepartmentUser[];
  categories: Category[];
  items: Item[];
  checkouts: Checkout[];
}

const DEFAULT_USERS: DepartmentUser[] = [
  {
    id: "user-super-admin",
    name: "Department Lead",
    email: "boss@department.local",
    role: "super-admin",
    status: "active",
    invitedBy: null,
    createdAt: "2026-01-10T08:30:00.000Z",
    updatedAt: "2026-01-10T08:30:00.000Z",
  },
  {
    id: "user-admin-1",
    name: "Admin 1",
    email: "admin1@department.local",
    role: "team-member",
    status: "active",
    invitedBy: "Department Lead",
    createdAt: "2026-01-10T08:35:00.000Z",
    updatedAt: "2026-01-10T08:35:00.000Z",
  },
  {
    id: "user-admin-2",
    name: "Admin 2",
    email: "admin2@department.local",
    role: "team-member",
    status: "active",
    invitedBy: "Department Lead",
    createdAt: "2026-01-10T08:40:00.000Z",
    updatedAt: "2026-01-10T08:40:00.000Z",
  },
];

function normalizeItem(item: Item): Item {
  return {
    ...item,
    identifierType: item.identifierType ?? (item.serialNumber ? "serial-number" : null),
    identifierValue: item.identifierValue ?? item.serialNumber ?? null,
  };
}

function normalizeCheckout(checkout: Checkout): Checkout {
  return {
    ...checkout,
    assignedToName: checkout.assignedToName ?? checkout.collectedBy,
    assignedToPhone: checkout.assignedToPhone ?? "",
    assignedToEmail: checkout.assignedToEmail ?? "",
  };
}

function normalizeDb(db: Partial<Db>): Db {
  return {
    users: db.users ?? DEFAULT_USERS,
    categories: db.categories ?? [],
    items: (db.items ?? []).map(normalizeItem),
    checkouts: (db.checkouts ?? []).map(normalizeCheckout),
  };
}

async function readDb(): Promise<Db> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    return normalizeDb(JSON.parse(raw));
  } catch {
    const seed = await fs.readFile(SEED_PATH, "utf-8");
    await fs.writeFile(DB_PATH, seed);
    return normalizeDb(JSON.parse(seed));
  }
}

async function writeDb(db: Db): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

export class MockStore implements DataStore {
  async getUsers(): Promise<DepartmentUser[]> {
    const db = await readDb();
    return db.users;
  }

  async getActiveUsers(): Promise<DepartmentUser[]> {
    const db = await readDb();
    return db.users.filter((u) => u.status === "active");
  }

  async getUser(id: string): Promise<DepartmentUser | null> {
    const db = await readDb();
    return db.users.find((u) => u.id === id) ?? null;
  }

  async getUserByEmail(email: string): Promise<DepartmentUser | null> {
    const db = await readDb();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async createUser(
    data: Omit<DepartmentUser, "id" | "createdAt" | "updatedAt">
  ): Promise<DepartmentUser> {
    const db = await readDb();
    if (db.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error("User already exists");
    }

    const now = new Date().toISOString();
    const user: DepartmentUser = {
      ...data,
      id: uuid(),
      email: data.email.toLowerCase(),
      createdAt: now,
      updatedAt: now,
    };
    db.users.push(user);
    await writeDb(db);
    return user;
  }

  async updateUser(id: string, data: Partial<DepartmentUser>): Promise<DepartmentUser> {
    const db = await readDb();
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");

    const nextEmail = data.email?.toLowerCase();
    if (
      nextEmail &&
      db.users.some((u) => u.id !== id && u.email.toLowerCase() === nextEmail)
    ) {
      throw new Error("User already exists");
    }

    db.users[index] = {
      ...db.users[index],
      ...data,
      email: nextEmail ?? db.users[index].email,
      updatedAt: new Date().toISOString(),
    };
    await writeDb(db);
    return db.users[index];
  }

  async deleteUser(id: string): Promise<void> {
    const db = await readDb();
    db.users = db.users.filter((u) => u.id !== id);
    await writeDb(db);
  }

  async getCategories(): Promise<Category[]> {
    const db = await readDb();
    return db.categories;
  }

  async getCategory(id: string): Promise<Category | null> {
    const db = await readDb();
    return db.categories.find((c) => c.id === id) ?? null;
  }

  async createCategory(data: Omit<Category, "id" | "createdAt">): Promise<Category> {
    const db = await readDb();
    const category: Category = { ...data, id: uuid(), createdAt: new Date().toISOString() };
    db.categories.push(category);
    await writeDb(db);
    return category;
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const db = await readDb();
    const index = db.categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Category not found");
    db.categories[index] = { ...db.categories[index], ...data };
    await writeDb(db);
    return db.categories[index];
  }

  async deleteCategory(id: string): Promise<void> {
    const db = await readDb();
    const itemIds = new Set(db.items.filter((i) => i.categoryId === id).map((i) => i.id));
    db.categories = db.categories.filter((c) => c.id !== id);
    db.items = db.items.filter((i) => i.categoryId !== id);
    db.checkouts = db.checkouts.filter((c) => !itemIds.has(c.itemId));
    await writeDb(db);
  }

  async getItems(): Promise<Item[]> {
    const db = await readDb();
    return db.items;
  }

  async getItem(id: string): Promise<Item | null> {
    const db = await readDb();
    return db.items.find((i) => i.id === id) ?? null;
  }

  async getItemsByCategory(categoryId: string): Promise<Item[]> {
    const db = await readDb();
    return db.items.filter((i) => i.categoryId === categoryId);
  }

  async createItem(data: Omit<Item, "id" | "createdAt">): Promise<Item> {
    const db = await readDb();
    const item: Item = { ...data, id: uuid(), createdAt: new Date().toISOString() };
    db.items.push(item);
    await writeDb(db);
    return item;
  }

  async updateItem(id: string, data: Partial<Item>): Promise<Item> {
    const db = await readDb();
    const index = db.items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Item not found");
    db.items[index] = { ...db.items[index], ...data };
    await writeDb(db);
    return db.items[index];
  }

  async deleteItem(id: string): Promise<void> {
    const db = await readDb();
    db.items = db.items.filter((i) => i.id !== id);
    db.checkouts = db.checkouts.filter((c) => c.itemId !== id);
    await writeDb(db);
  }

  async getCheckouts(): Promise<Checkout[]> {
    const db = await readDb();
    return db.checkouts;
  }

  async getCheckout(id: string): Promise<Checkout | null> {
    const db = await readDb();
    return db.checkouts.find((c) => c.id === id) ?? null;
  }

  async getCheckoutsByItem(itemId: string): Promise<Checkout[]> {
    const db = await readDb();
    return db.checkouts.filter((c) => c.itemId === itemId);
  }

  async getCheckoutsByAdmin(adminName: string): Promise<Checkout[]> {
    const db = await readDb();
    return db.checkouts.filter((c) => c.collectedBy === adminName);
  }

  async createCheckout(data: Omit<Checkout, "id">): Promise<Checkout> {
    const db = await readDb();
    const checkout: Checkout = { ...data, id: uuid() };
    db.checkouts.push(checkout);
    await writeDb(db);
    return checkout;
  }

  async updateCheckout(id: string, data: Partial<Checkout>): Promise<Checkout> {
    const db = await readDb();
    const index = db.checkouts.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Checkout not found");
    db.checkouts[index] = { ...db.checkouts[index], ...data };
    await writeDb(db);
    return db.checkouts[index];
  }
}
