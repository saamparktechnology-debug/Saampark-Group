import clientPromise from "@/lib/mongodb";

export async function GET() {
  await clientPromise;
  return Response.json({ message: "Database Connected Successfully" });
}