import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { Task, TaskStatus } from "@/lib/types";

const allowedStatuses: TaskStatus[] = ["To do", "In progress", "Review", "Done"];

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  const db = await readDb();
  const task = (db.tasks || []).find((t) => t.id === numericId);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json(task);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  try {
    const body = (await req.json()) as Partial<Task>;

    const db = await readDb();
    const tasks = db.tasks || [];
    const index = tasks.findIndex((t) => t.id === numericId);

    if (index === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const current = tasks[index];
    tasks[index] = {
      ...current,
      title: body.title?.trim() ?? current.title,
      description: body.description !== undefined ? body.description.trim() : current.description,
      relatedTo: body.relatedTo?.trim() ?? current.relatedTo,
      points: body.points?.trim() ?? current.points,
      assignedTo: body.assignedTo?.trim() ?? current.assignedTo,
      collaborators: body.collaborators !== undefined ? body.collaborators.trim() : current.collaborators,
      status: allowedStatuses.includes(body.status as TaskStatus)
        ? (body.status as TaskStatus)
        : current.status,
      priority: body.priority !== undefined ? body.priority : current.priority,
      labels: body.labels !== undefined ? body.labels.trim() : current.labels,
      startDate: body.startDate !== undefined ? body.startDate : current.startDate,
      deadline: body.deadline !== undefined ? body.deadline : current.deadline,
      recurring: body.recurring !== undefined ? !!body.recurring : current.recurring,
      avatar: body.avatar !== undefined ? body.avatar : current.avatar,
      checklist: body.checklist !== undefined ? body.checklist : current.checklist,
      subTasks: body.subTasks !== undefined ? body.subTasks : current.subTasks,
      comments: body.comments !== undefined ? body.comments : current.comments,
      timeLogged: body.timeLogged !== undefined ? body.timeLogged : current.timeLogged,
    };

    db.tasks = tasks;
    await writeDb(db);

    return NextResponse.json(tasks[index]);
  } catch (err) {
    console.error("Failed to update task", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  try {
    const db = await readDb();
    const tasks = db.tasks || [];
    const before = tasks.length;
    db.tasks = tasks.filter((t) => t.id !== numericId);

    if (db.tasks.length === before) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await writeDb(db);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete task", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
