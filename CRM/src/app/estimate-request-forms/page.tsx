"use client";

import { Plus, Search, Pencil, X, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";

type Form = {
  id: string;
  title: string;
  public: boolean;
  embed: boolean;
  status: "Active" | "Inactive";
};

const DEMO_FORMS: Form[] = [
  { id: "1", title: "Website Development", public: false, embed: true, status: "Active" },
];

export default function EstimateRequestFormsPage() {
  const [forms] = useState<Form[]>(DEMO_FORMS);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const filteredForms = forms.filter((f) =>
    f.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredForms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentForms = filteredForms.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="card p-3">
      {/* Section 1: Global Navigation & Primary Action */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded p-1 hover:bg-[#f5f6f7]">
            {sidebarOpen ? <PanelLeftClose size={18} className="text-[#607183]" /> : <PanelLeftOpen size={18} className="text-[#607183]" />}
          </button>
          <div className="flex gap-1">
            <button className="rounded px-3 py-1.5 text-sm font-medium text-[#607183] hover:bg-[#f5f6f7]">Estimates</button>
            <button className="rounded px-3 py-1.5 text-sm font-medium text-[#607183] hover:bg-[#f5f6f7]">Estimate Requests</button>
            <button className="rounded px-3 py-1.5 text-sm font-medium text-[#253445] border-b-2 border-[#253445]">Estimate Request Forms</button>
          </div>
        </div>
        <button className="inline-flex items-center gap-1 rounded border border-[#253445] px-3 py-1.5 text-sm font-medium text-[#253445]">
          <Plus size={16} /> Add form
        </button>
      </div>

      {/* Section 2: Utility Toolbar */}
      <div className="mb-3 flex items-center justify-between rounded border border-[var(--border)] p-2 text-sm text-[#607183]">
        <div className="flex items-center gap-2">
          <button className="rounded border border-[var(--border)] px-3 py-1.5 hover:bg-[#f5f6f7]">Filters</button>
          <button className="rounded-full border border-[var(--border)] px-3 py-1.5">All forms</button>
          <button className="rounded-full border border-[var(--border)] px-3 py-1.5 hover:bg-[#f5f6f7]">Active</button>
          <button className="rounded-full border border-[var(--border)] px-3 py-1.5 hover:bg-[#f5f6f7]">Inactive</button>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-[#607183] hover:text-[#253445]">Print</button>
          <div className="relative">
            <Search size={14} className="absolute left-2 top-2 text-[#93a2b4]" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded border border-[var(--border)] py-1.5 pl-7 pr-3 text-sm w-48"
              placeholder="Search"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Request Forms Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-t border-[var(--border)]">
          <thead>
            <tr>
              <th className="table-head py-2 text-left">Title</th>
              <th className="table-head py-2 text-left">
                Public
                <button className="ml-1 text-[#607183]">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 2L9 7H3L6 2Z" fill="currentColor"/>
                    <path d="M6 10L3 5H9L6 10Z" fill="currentColor"/>
                  </svg>
                </button>
              </th>
              <th className="table-head py-2 text-left">Embed</th>
              <th className="table-head py-2 text-left">Status</th>
              <th className="table-head py-2" />
            </tr>
          </thead>
          <tbody>
            {currentForms.map((form) => (
              <tr key={form.id} className="border-t border-[var(--border)]">
                <td className="table-cell py-2">
                  <a href="#" className="text-[#4A90D9] hover:underline">{form.title}</a>
                </td>
                <td className="table-cell py-2">{form.public ? "Yes" : "No"}</td>
                <td className="table-cell py-2">{form.embed ? "Yes" : "No"}</td>
                <td className="table-cell py-2">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${form.status === "Active" ? "bg-[#20b683] text-white" : "bg-[#6b7280] text-white"}`}>
                    {form.status}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="text-[#607183] hover:text-[#253445]"><Pencil size={16} /></button>
                    <button className="text-[#607183] hover:text-[#ef4d6d]"><X size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 4: Pagination & Footer */}
      <div className="mt-3 flex items-center justify-between text-sm text-[#718194]">
        <div className="flex items-center gap-2">
          <select 
            value={itemsPerPage}
            className="rounded border border-[var(--border)] px-2 py-1"
          >
            <option>10</option>
          </select>
          <span>1-{currentForms.length} / {filteredForms.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[#f5f6f7]">
            <ChevronLeft size={16} />
          </button>
          <button className="rounded border border-[var(--border)] px-2 py-1 bg-[#253445] text-white">1</button>
          <button className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[#f5f6f7]">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}