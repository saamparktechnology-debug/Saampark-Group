import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { Ticket, TicketStatus } from "@/lib/types";

const allowedStatuses: TicketStatus[] = ["New", "Open", "Closed"];

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  const db = await readDb();
  const ticket = (db.tickets || []).find((t) => t.id === numericId);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }
  return NextResponse.json(ticket);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  try {
    const body = (await req.json()) as Partial<Ticket>;

    const db = await readDb();
    const tickets = db.tickets || [];
    const index = tickets.findIndex((t) => t.id === numericId);

    if (index === -1) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const current = tickets[index];
    tickets[index] = {
      ...current,
      title: body.title?.trim() ?? current.title,
      client: body.client?.trim() ?? current.client,
      requestedBy: body.requestedBy?.trim() ?? current.requestedBy,
      ticketType: body.ticketType?.trim() ?? current.ticketType,
      labels: body.labels !== undefined ? body.labels.trim() : current.labels,
      assignedTo: body.assignedTo?.trim() ?? current.assignedTo,
      status: allowedStatuses.includes(body.status as TicketStatus)
        ? (body.status as TicketStatus)
        : current.status,
      description: body.description !== undefined ? body.description.trim() : current.description,
      files: body.files !== undefined ? body.files : current.files,
      comments: body.comments !== undefined ? body.comments : current.comments,
      tasksList: body.tasksList !== undefined ? body.tasksList : current.tasksList,
      remindersList: body.remindersList !== undefined ? body.remindersList : current.remindersList,
      lastActivity: new Date().toISOString()
    };

    db.tickets = tickets;
    await writeDb(db);

    return NextResponse.json(tickets[index]);
  } catch (err) {
    console.error("Failed to update ticket", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  try {
    const db = await readDb();
    const tickets = db.tickets || [];
    const before = tickets.length;
    db.tickets = tickets.filter((t) => t.id !== numericId);

    if (db.tickets.length === before) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    await writeDb(db);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete ticket", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
