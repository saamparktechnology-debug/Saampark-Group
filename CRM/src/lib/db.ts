import { promises as fs } from "node:fs";
import path from "node:path";
import type { AppDb, Task, Ticket, TicketTemplate } from "@/lib/types";

const DB_PATH = path.join(process.cwd(), "data", "app-db.json");
const INITIAL_TASKS_PATH = path.join(process.cwd(), "data", "initial-tasks.json");
const INITIAL_TICKETS_PATH = path.join(process.cwd(), "data", "initial-tickets.json");
const INITIAL_TEMPLATES_PATH = path.join(process.cwd(), "data", "initial-templates.json");

async function getInitialTasks(): Promise<Task[]> {
  try {
    const content = await fs.readFile(INITIAL_TASKS_PATH, "utf8");
    return JSON.parse(content) as Task[];
  } catch (err) {
    console.error("Failed to read initial-tasks.json, using empty array", err);
    return [];
  }
}

async function getInitialTickets(): Promise<Ticket[]> {
  try {
    const content = await fs.readFile(INITIAL_TICKETS_PATH, "utf8");
    return JSON.parse(content) as Ticket[];
  } catch (err) {
    console.error("Failed to read initial-tickets.json, using empty array", err);
    return [];
  }
}

async function getInitialTemplates(): Promise<TicketTemplate[]> {
  try {
    const content = await fs.readFile(INITIAL_TEMPLATES_PATH, "utf8");
    return JSON.parse(content) as TicketTemplate[];
  } catch (err) {
    console.error("Failed to read initial-templates.json, using empty array", err);
    return [];
  }
}

async function ensureDbFile() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    const tasks = await getInitialTasks();
    const tickets = await getInitialTickets();
    const ticketTemplates = await getInitialTemplates();
    const emptyDb: AppDb = { leads: [], dashboards: [], projects: [], tasks, tickets, ticketTemplates };
    await fs.writeFile(DB_PATH, JSON.stringify(emptyDb, null, 2), "utf8");
  }
}

export async function readDb(): Promise<AppDb> {
  await ensureDbFile();
  const content = await fs.readFile(DB_PATH, "utf8");
  try {
    const db = JSON.parse(content) as AppDb;
    let mutated = false;
    if (!db.tasks) {
      db.tasks = await getInitialTasks();
      mutated = true;
    }
    if (!db.tickets) {
      db.tickets = await getInitialTickets();
      mutated = true;
    }
    if (!db.ticketTemplates) {
      db.ticketTemplates = await getInitialTemplates();
      mutated = true;
    }
    if (mutated) {
      await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
    }
    return db;
  } catch (error) {
    console.error("Database file corrupted. Resetting to safe state...", error);
    const tasks = await getInitialTasks();
    const tickets = await getInitialTickets();
    const ticketTemplates = await getInitialTemplates();
    const emptyDb: AppDb = { leads: [], dashboards: [], projects: [], tasks, tickets, ticketTemplates };
    await fs.writeFile(DB_PATH, JSON.stringify(emptyDb, null, 2), "utf8");
    return emptyDb;
  }
}

export async function writeDb(db: AppDb): Promise<void> {
  await ensureDbFile();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}
