import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const { id, updateData } = await request.json();

    if (!id || !updateData) {
      return NextResponse.json({ error: "Missing ID or update data" }, { status: 400 });
    }

    // MongoDB's _id is an ObjectId, so we need to convert the string from the request.
    const filter = { _id: new ObjectId(id) };

    // Ensure we don't try to update the immutable _id field.
    delete updateData._id;

    const updateDoc = {
      $set: updateData,
    };

    const result = await db.collection("events").updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Event updated successfully" }, { status: 200 });
  } catch (e) {
    console.error(e);
    // Handle cases where the provided ID is not a valid ObjectId format.
    if (e instanceof Error && e.message.includes("Argument passed in must be a string")) {
        return NextResponse.json({ error: "Invalid event ID format" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}