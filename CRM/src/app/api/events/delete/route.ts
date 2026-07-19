import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    const result = await db.collection("events").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Event not found or already deleted" }, { status: 404 });
    }

    return NextResponse.json({ message: "Event deleted successfully" }, { status: 200 });
  } catch (e) {
    console.error(e);
    if (e instanceof Error && e.message.includes("Argument passed in must be a string")) {
        return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}