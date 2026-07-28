import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const DEMO_EVENTS = [
  {
    title: "Quarterly Review",
    date: new Date().toISOString().split('T')[0],
    startTime: "10:00",
    color: "bg-[#4A90D9]",
    description: "Review quarterly performance and goals.",
    type: "Meeting"
  },
  {
    title: "Product Launch",
    date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0],
    startTime: "14:00",
    color: "bg-[#3BAA6E]",
    description: "Launch the new product features.",
    type: "Workshop"
  },
  {
    title: "Team Outing",
    date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
    startTime: "16:30",
    color: "bg-[#E05252]",
    description: "Annual team building event.",
    type: "Other"
  }
];

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection("events");
    
    let events = await collection.find({}).toArray();

    if (events.length === 0) {
      await collection.insertMany(DEMO_EVENTS);
      events = await collection.find({}).toArray();
    }

    return NextResponse.json(events);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const eventData = await request.json();

    // Ensure no _id is accidentally passed which causes MongoDB Duplicate Key Error
    if (eventData._id) {
      delete eventData._id;
    }

    const result = await db.collection("events").insertOne(eventData);

    return NextResponse.json({ insertedId: result.insertedId.toString() }, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Failed to save event" }, { status: 500 });
  }
}