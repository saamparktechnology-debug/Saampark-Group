import { NextResponse } from "next/server";
import { makeId, readDb, writeDb } from "@/lib/db";
import type { Lead, LeadStatus } from "@/lib/types";

const allowedStatuses: LeadStatus[] = ["New", "Negotiation", "Discussion", "Qualified", "Won", "Lost"];

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.leads);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Lead>;
  if (!body.name || !body.contact || !body.owner) {
    return NextResponse.json({ error: "name, contact, owner are required" }, { status: 400 });
  }

  const lead: Lead = {
    id: makeId("lead"),
    name: body.name.trim(),
    contact: body.contact.trim(),
    phone: body.phone?.trim() ?? "",
    owner: body.owner.trim(),
    createdAt: new Date().toISOString(),
    deadline: body.deadline ?? "",
    status: allowedStatuses.includes(body.status as LeadStatus) ? (body.status as LeadStatus) : "New",
    label: body.label?.trim() ?? "",
    type: body.type === "person" ? "person" : "organization",
    email: body.email?.trim() ?? "",
    managers: body.managers?.trim() ?? "",
    source: body.source?.trim() ?? "",
    address: body.address?.trim() ?? "",
    city: body.city?.trim() ?? "",
    state: body.state?.trim() ?? "",
    zip: body.zip?.trim() ?? "",
    amount: typeof body.amount === "number" ? body.amount : Number(body.amount) || 0,
  };

  const db = await readDb();
  db.leads.unshift(lead);
  await writeDb(db);
  return NextResponse.json(lead, { status: 201 });
}
