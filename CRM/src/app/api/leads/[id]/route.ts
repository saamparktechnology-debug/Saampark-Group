import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { Lead, LeadStatus } from "@/lib/types";

const allowedStatuses: LeadStatus[] = ["New", "Negotiation", "Discussion", "Qualified", "Won", "Lost"];

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readDb();
  const lead = db.leads.find((item) => item.id === id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  return NextResponse.json(lead);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<Lead>;

  const db = await readDb();
  const index = db.leads.findIndex((item) => item.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const current = db.leads[index];
  db.leads[index] = {
    ...current,
    name: body.name?.trim() ?? current.name,
    contact: body.contact?.trim() ?? current.contact,
    phone: body.phone?.trim() ?? current.phone,
    owner: body.owner?.trim() ?? current.owner,
    deadline: body.deadline !== undefined ? body.deadline : current.deadline,
    label: body.label?.trim() ?? current.label,
    status: allowedStatuses.includes(body.status as LeadStatus) ? (body.status as LeadStatus) : current.status,
    type: body.type === "person" || body.type === "organization" ? body.type : current.type,
    email: body.email !== undefined ? body.email?.trim() : current.email,
    managers: body.managers !== undefined ? body.managers?.trim() : current.managers,
    source: body.source !== undefined ? body.source?.trim() : current.source,
    address: body.address !== undefined ? body.address?.trim() : current.address,
    city: body.city !== undefined ? body.city?.trim() : current.city,
    state: body.state !== undefined ? body.state?.trim() : current.state,
    zip: body.zip !== undefined ? body.zip?.trim() : current.zip,
    amount: body.amount !== undefined ? (typeof body.amount === "number" ? body.amount : Number(body.amount) || 0) : current.amount,
    contactsList: body.contactsList !== undefined ? body.contactsList : current.contactsList,
    eventsList: body.eventsList !== undefined ? body.eventsList : current.eventsList,
    tasksList: body.tasksList !== undefined ? body.tasksList : current.tasksList,
    notesList: body.notesList !== undefined ? body.notesList : current.notesList,
    remindersList: body.remindersList !== undefined ? body.remindersList : current.remindersList,
    estimatesList: body.estimatesList !== undefined ? body.estimatesList : current.estimatesList,
    proposalsList: body.proposalsList !== undefined ? body.proposalsList : current.proposalsList,
    contractsList: body.contractsList !== undefined ? body.contractsList : current.contractsList,
  };

  await writeDb(db);
  return NextResponse.json(db.leads[index]);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readDb();
  const before = db.leads.length;
  db.leads = db.leads.filter((item) => item.id !== id);

  if (db.leads.length === before) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  await writeDb(db);
  return NextResponse.json({ ok: true });
}
