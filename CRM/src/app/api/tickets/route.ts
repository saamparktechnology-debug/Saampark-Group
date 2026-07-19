import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { Ticket, TicketStatus } from "@/lib/types";

const allowedStatuses: TicketStatus[] = ["New", "Open", "Closed"];

export async function GET() {
  try {
    const db = await readDb();
    return NextResponse.json(db.tickets || []);
  } catch (err) {
    console.error("Failed to read tickets", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Ticket>;
    if (!body.title || !body.client) {
      return NextResponse.json({ error: "title and client are required" }, { status: 400 });
    }

    const db = await readDb();
    const tickets = db.tickets || [];

    // Generate unique sequential numeric ID
    const nextId = tickets.length > 0 ? Math.max(...tickets.map((t) => t.id)) + 1 : 12;

    const ticket: Ticket = {
      id: nextId,
      title: body.title.trim(),
      client: body.client.trim(),
      requestedBy: body.requestedBy?.trim() ?? body.client.trim(),
      ticketType: body.ticketType?.trim() ?? "General Support",
      labels: body.labels?.trim() ?? "",
      assignedTo: body.assignedTo?.trim() ?? "John Doe",
      lastActivity: new Date().toISOString(),
      status: allowedStatuses.includes(body.status as TicketStatus)
        ? (body.status as TicketStatus)
        : "New",
      description: body.description?.trim() ?? "",
      files: body.files ?? []
    };

    tickets.unshift(ticket);
    db.tickets = tickets;
    await writeDb(db);

    return NextResponse.json(ticket, { status: 201 });
  } catch (err) {
    console.error("Failed to create ticket", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
