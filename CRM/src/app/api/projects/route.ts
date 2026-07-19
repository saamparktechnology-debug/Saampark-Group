import { NextResponse } from "next/server";
import { readDb, writeDb, makeId } from "@/lib/db";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const DEMO_PROJECTS = [
  {
    title: "WordPress Plugin Development",
    client: "-",
    price: "-",
    startDate: "21-12-2025",
    deadline: "08-02-2026",
    progress: 30,
    status: "Open",
    tag: { label: "Urgent", className: "bg-[#d89cf2] text-white" }
  },
  {
    title: "Website Maintenance and Updates",
    client: "Birdie Erdman",
    price: "$3,500.00",
    startDate: "08-01-2026",
    deadline: "12-02-2026",
    progress: 20,
    status: "Open",
    tag: { label: "Urgent", className: "bg-[#d89cf2] text-white" }
  },
  {
    title: "Virtual Reality Experience Design",
    client: "-",
    price: "-",
    startDate: "12-02-2026",
    deadline: "19-02-2026",
    progress: 20,
    status: "Open",
    tag: { label: "On track", className: "bg-[#8ed065] text-white" }
  },
  {
    title: "Video Animation and Editing",
    client: "Kevin Johnston",
    price: "-",
    startDate: "17-02-2026",
    deadline: "08-09-2023",
    progress: 100,
    status: "Completed"
  },
  {
    title: "UI/UX Design for Web App",
    client: "Howard Halvorson",
    price: "-",
    startDate: "10-01-2026",
    deadline: "23-03-2026",
    progress: 35,
    status: "Open",
    tag: { label: "On track", className: "bg-[#8ed065] text-white" }
  },
  {
    title: "Software Development for CRM",
    client: "Adrain Ondricka",
    price: "$1,000.00",
    startDate: "01-02-2026",
    deadline: "08-03-2026",
    progress: 100,
    status: "Completed"
  },
  {
    title: "Social Media Marketing Campaign",
    client: "Fritsch, Okuneva and Armstrong",
    price: "-",
    startDate: "05-01-2026",
    deadline: "09-02-2026",
    progress: 100,
    status: "Completed"
  },
  {
    title: "Social Media Influencer Collaboration",
    client: "Alta Cassin",
    price: "$2,500.00",
    startDate: "21-02-2026",
    deadline: "02-09-2023",
    progress: 5,
    status: "Open",
    tag: { label: "Upcoming", className: "bg-[#f2bb59] text-white" }
  },
  {
    title: "Social Media Content Calendar",
    client: "Adrain Ondricka",
    price: "$4,000.00",
    startDate: "15-02-2026",
    deadline: "04-10-2023",
    progress: 100,
    status: "Completed"
  },
  {
    title: "SEO Optimization Strategy",
    client: "Abshire-Swaniawski",
    price: "$4,000.00",
    startDate: "20-12-2025",
    deadline: "14-02-2026",
    progress: 35,
    status: "Open",
    tag: { label: "Urgent", className: "bg-[#d89cf2] text-white" }
  }
];

// Try MongoDB first, fallback to local JSON
async function getProjectsFromMongo() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection("projects");
    
    let projects = await collection.find({}).toArray();

    if (projects.length === 0) {
      await collection.insertMany(DEMO_PROJECTS);
      projects = await collection.find({}).toArray();
    }

    return { source: "mongodb", data: projects };
  } catch (e) {
    console.error("MongoDB error, falling back to local DB:", e);
    return null;
  }
}

async function getProjectsFromLocal(): Promise<any[]> {
  const db = await readDb();
  if (!db.projects) {
    db.projects = DEMO_PROJECTS.map((p, idx) => ({
      id: `proj-${idx + 1}`,
      ...p,
      status: p.status as "Open" | "Completed",
    }));
    await writeDb(db);
  }
  return db.projects;
}

export async function GET() {
  try {
    // Try MongoDB first
    const mongoResult = await getProjectsFromMongo();
    
    if (mongoResult) {
      return NextResponse.json(mongoResult.data);
    }

    // Fallback to local JSON
    const localProjects = await getProjectsFromLocal();
    return NextResponse.json(localProjects);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const projectData = await request.json();
    const id = makeId("project");

    // Try MongoDB first
    let mongoSuccess = false;
    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);
      
      if (projectData._id) {
        delete projectData._id;
      }

      const result = await db.collection("projects").insertOne({ ...projectData, id });
      mongoSuccess = true;
      return NextResponse.json({ insertedId: result.insertedId.toString() }, { status: 201 });
    } catch (e) {
      console.error("MongoDB POST error, using local DB:", e);
    }

    // Fallback to local JSON
    const db = await readDb();
    if (!db.projects) {
      db.projects = [];
    }
    db.projects.push({ ...projectData, id });
    await writeDb(db);

    return NextResponse.json({ insertedId: id }, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Failed to save project" }, { status: 500 });
  }
}