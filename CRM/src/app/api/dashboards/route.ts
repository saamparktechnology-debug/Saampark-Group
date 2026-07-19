import { NextResponse } from "next/server";
import { makeId, readDb, writeDb } from "@/lib/db";
import type { DashboardConfig, DashboardGraphType } from "@/lib/types";

const graphTypes: DashboardGraphType[] = ["donut", "bar", "area"];

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.dashboards);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<DashboardConfig>;
  if (!body.label) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const dashboard: DashboardConfig = {
    id: makeId("dashboard"),
    label: body.label.trim(),
    openTasks: Number.isFinite(body.openTasks) ? Number(body.openTasks) : 0,
    events: Number.isFinite(body.events) ? Number(body.events) : 0,
    due: body.due?.trim() || "₹0.00",
    graphType: graphTypes.includes(body.graphType as DashboardGraphType) ? (body.graphType as DashboardGraphType) : "donut",
    ticketColor: body.ticketColor?.trim() || "#18b588",
  };

  const db = await readDb();
  db.dashboards.push(dashboard);
  await writeDb(db);
  return NextResponse.json(dashboard, { status: 201 });
}
