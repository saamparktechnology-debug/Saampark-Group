import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { DashboardConfig, DashboardGraphType } from "@/lib/types";

const graphTypes: DashboardGraphType[] = ["donut", "bar", "area"];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<DashboardConfig>;

  const db = await readDb();
  const index = db.dashboards.findIndex((item) => item.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  }

  const current = db.dashboards[index];
  db.dashboards[index] = {
    ...current,
    label: body.label?.trim() ?? current.label,
    openTasks: Number.isFinite(body.openTasks) ? Number(body.openTasks) : current.openTasks,
    events: Number.isFinite(body.events) ? Number(body.events) : current.events,
    due: body.due?.trim() ?? current.due,
    graphType: graphTypes.includes(body.graphType as DashboardGraphType) ? (body.graphType as DashboardGraphType) : current.graphType,
    ticketColor: body.ticketColor?.trim() ?? current.ticketColor,
  };

  await writeDb(db);
  return NextResponse.json(db.dashboards[index]);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readDb();
  const before = db.dashboards.length;
  db.dashboards = db.dashboards.filter((item) => item.id !== id);

  if (db.dashboards.length === before) {
    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  }

  await writeDb(db);
  return NextResponse.json({ ok: true });
}
