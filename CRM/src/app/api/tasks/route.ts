import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { Task, TaskStatus } from "@/lib/types";

const allowedStatuses: TaskStatus[] = ["To do", "In progress", "Review", "Done"];

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.tasks || []);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Task>;
    if (!body.title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const db = await readDb();
    const tasks = db.tasks || [];

    // Generate unique numeric ID
    const nextId = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 3000;

    const task: Task = {
      id: nextId,
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      relatedTo: body.relatedTo?.trim() ?? "-",
      points: body.points?.trim() ?? "1 Point",
      assignedTo: body.assignedTo?.trim() ?? "John Doe",
      collaborators: body.collaborators?.trim() ?? "-",
      status: allowedStatuses.includes(body.status as TaskStatus)
        ? (body.status as TaskStatus)
        : "To do",
      priority: body.priority ?? undefined,
      labels: body.labels?.trim() ?? "",
      startDate: body.startDate ?? "",
      deadline: body.deadline ?? "",
      recurring: !!body.recurring,
      avatar: body.avatar ?? `https://i.pravatar.cc/60?img=${Math.floor(Math.random() * 70) + 1}`
    };

    tasks.unshift(task);
    db.tasks = tasks;
    await writeDb(db);

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("Failed to create task", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
