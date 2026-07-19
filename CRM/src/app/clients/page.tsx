import ClientsTable from "@/components/clients/ClientsTable";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export default function ClientsPage() {
  return <ClientsTable />;
}


export async function GET() {

  const client = await clientPromise;
  const db = client.db("sampark");

  const clients = await db.collection("clients").find({}).toArray();

  return NextResponse.json(clients);

}

export async function POST(req:Request) {

  const data = await req.json();

  const client = await clientPromise;
  const db = client.db("crm");

  await db.collection("clients").insertOne(data);

  return NextResponse.json({success:true});

}