import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { TicketTemplate } from "@/lib/types";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  const db = await readDb();
  const template = (db.ticketTemplates || []).find((t) => t.id === numericId);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  return NextResponse.json(template);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  try {
    const body = (await req.json()) as Partial<TicketTemplate>;

    const db = await readDb();
    const templates = db.ticketTemplates || [];
    const index = templates.findIndex((t) => t.id === numericId);

    if (index === -1) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const current = templates[index];
    templates[index] = {
      ...current,
      title: body.title?.trim() ?? current.title,
      description: body.description !== undefined ? body.description.trim() : current.description,
      ticketType: body.ticketType?.trim() ?? current.ticketType,
      private: body.private !== undefined ? !!body.private : current.private
    };

    db.ticketTemplates = templates;
    await writeDb(db);

    return NextResponse.json(templates[index]);
  } catch (err) {
    console.error("Failed to update ticket template", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  try {
    const db = await readDb();
    const templates = db.ticketTemplates || [];
    const before = templates.length;
    db.ticketTemplates = templates.filter((t) => t.id !== numericId);

    if (db.ticketTemplates.length === before) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    await writeDb(db);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete ticket template", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
