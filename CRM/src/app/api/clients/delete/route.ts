import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, message: "ID missing" });
    }

    const client = await clientPromise;
    const db = client.db("crm");

    const result = await db.collection("clients").deleteOne({
      _id: new ObjectId(id)
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json({ success: false });
  }
}