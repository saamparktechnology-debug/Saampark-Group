import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req:Request){

  const {email,updateData} = await req.json();

  const client = await clientPromise;
  const db = client.db("crm");

  await db.collection("clients").updateOne(
    {email},
    {$set:updateData}
  );

  return NextResponse.json({success:true});
}