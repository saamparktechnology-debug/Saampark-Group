"use client";

import { PlusCircle, Upload, Tag, Search, Plus } from "lucide-react";
import { useEffect, useState } from "react";

type Project = {
  _id?: string;
  id?: number;
  title: string;
  client: string;
  price: string;
  startDate: string;
  deadline: string;
  progress: number;
  status: "Open" | "Completed";
  tag?: { label: string; className: string };
};

export default function ProjectsTable() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (!res.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProject = {
      title: formData.get("title"),
      client: formData.get("client"),
      price: formData.get("price"),
      startDate: formData.get("startDate"),
      deadline: formData.get("deadline"),
      progress: 0,
      status: "Open" as const,
    };

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchProjects();
      }
    } catch (err) {
      console.error("Error adding project:", err);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="card p-3">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="section-title text-[28px]">Projects</h1>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-[#607183]">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-3">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="section-title text-[28px]">Projects</h1>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-[#ef4d6d]">Error: {error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="card p-3">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="section-title text-[28px]">Projects</h1>
        <div className="flex gap-2 text-sm">
          <button className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-3 py-1.5 text-[#607183]"><Tag size={14} />Manage labels</button>
          <button className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-3 py-1.5 text-[#607183]"><Upload size={14} />Import projects</button>
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-3 py-1.5 text-[#607183] hover:bg-[#f5f6f7]"><Plus size={14} />Add project</button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between rounded border border-[var(--border)] p-2 text-sm text-[#607183]">
        <div className="flex items-center gap-2">
          <button className="rounded border border-[var(--border)] px-3 py-1">Filters</button>
          <button className="rounded-full border border-[var(--border)] px-3 py-1">All projects</button>
          <button className="rounded-full border border-[var(--border)] px-3 py-1">Completed</button>
          <button className="rounded-full border border-[var(--border)] px-3 py-1">High Priority</button>
          <button className="rounded-full border border-[var(--border)] px-3 py-1">Open projects</button>
          <button className="rounded-full border border-[var(--border)] px-3 py-1">Upcoming</button>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-[#607183] hover:text-[#253445]">Excel</button>
          <button className="text-[#607183] hover:text-[#253445]">Print</button>
          <div className="relative">
            <Search size={14} className="absolute left-2 top-2 text-[#93a2b4]" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded border border-[var(--border)] py-1.5 pl-7 pr-3 text-sm w-48" placeholder="Search projects..." />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-t border-[var(--border)]">
          <thead>
            <tr>
              <th className="table-head py-2 text-left">ID</th>
              <th className="table-head py-2 text-left">Title</th>
              <th className="table-head py-2 text-left">Client</th>
              <th className="table-head py-2 text-left">Price</th>
              <th className="table-head py-2 text-left">Start date</th>
              <th className="table-head py-2 text-left">Deadline</th>
              <th className="table-head py-2 text-left">Progress</th>
              <th className="table-head py-2 text-left">Status</th>
              <th className="table-head py-2" />
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project, index) => (
              <tr key={project._id || index} className="border-t border-[var(--border)]">
                <td className="table-cell py-2">{index + 1}</td>
                <td className="table-cell py-2">
                  <div>
                    <p>{project.title}</p>
                    {project.tag ? <span className={`mt-1 inline-block rounded px-2 py-0.5 text-[11px] ${project.tag.className}`}>{project.tag.label}</span> : null}
                  </div>
                </td>
                <td className="table-cell py-2">{project.client}</td>
                <td className="table-cell py-2">{project.price}</td>
                <td className="table-cell py-2">{project.startDate}</td>
                <td className={`table-cell py-2 ${project.status === "Open" ? "text-[#ef4d6d]" : ""}`}>{project.deadline}</td>
                <td className="table-cell py-2">
                  <div className="h-2 w-24 rounded bg-[#e7edf3]">
                    <div className={`h-2 rounded ${project.status === "Completed" ? "bg-[#20b683]" : "bg-[#253445]"}`} style={{ width: `${project.progress}%` }} />
                  </div>
                </td>
                <td className="table-cell py-2">{project.status}</td>
                <td className="py-2 text-right text-[#9ba9b8]">o o x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-[#718194]">
        <div className="flex items-center gap-2">
          <select className="rounded border border-[var(--border)] px-2 py-1">
            <option>10</option>
          </select>
          <span>1-10 / {projects.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[#f5f6f7]">{"<"}</button>
          <button className="rounded border border-[var(--border)] px-2 py-1 bg-[#253445] text-white">1</button>
          <button className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[#f5f6f7]">2</button>
          <button className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[#f5f6f7]">{">"}</button>
        </div>
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-[#253445]">Add New Project</h2>
            <form onSubmit={handleAddProject}>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#607183]">Project Title</label>
                  <input name="title" required className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" placeholder="Enter project title" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#607183]">Client</label>
                  <input name="client" className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" placeholder="Enter client name" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#607183]">Price</label>
                  <input name="price" className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" placeholder="$0.00" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#607183]">Start Date</label>
                    <input name="startDate" type="date" className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#607183]">Deadline</label>
                    <input name="deadline" type="date" className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded border border-[var(--border)] px-4 py-2 text-sm text-[#607183] hover:bg-[#f5f6f7]">Cancel</button>
                <button type="submit" className="rounded bg-[#253445] px-4 py-2 text-sm text-white hover:bg-[#1a2530]">Add Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
