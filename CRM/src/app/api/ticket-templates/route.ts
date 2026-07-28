import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { TicketTemplate } from "@/lib/types";

export async function GET() {
  try {
    const db = await readDb();
    return NextResponse.json(db.ticketTemplates || []);
  } catch (err) {
    console.error("Failed to read ticket templates", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<TicketTemplate>;
    if (!body.title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const db = await readDb();
    const templates = db.ticketTemplates || [];

    // Generate unique sequential ID
    const nextId = templates.length > 0 ? Math.max(...templates.map((t) => t.id)) + 1 : 3;

    const template: TicketTemplate = {
      id: nextId,
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      ticketType: body.ticketType?.trim() ?? "-",
      private: !!body.private
    };

    templates.push(template); // append at the end as in the list or push/unshift
    db.ticketTemplates = templates;
    await writeDb(db);

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error("Failed to create ticket template", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
