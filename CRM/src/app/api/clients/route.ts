import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("sampark"); // ⚠️ check this

    const clients = await db.collection("clients").find({}).toArray();

    return NextResponse.json(clients);
  } catch (error: any) {
    console.error("GET ERROR:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("sampark"); // ⚠️ SAME DB NAME

    const result = await db.collection("clients").insertOne(body);

    // ✅ MUST RETURN JSON
    return NextResponse.json({
      insertedId: result.insertedId
    });

  } catch (error: any) {
    console.error("POST ERROR:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}