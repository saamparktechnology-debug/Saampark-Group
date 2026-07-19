"use client";

import { Plus, Search, Eye, MoreHorizontal, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, ArrowUpDown } from "lucide-react";
import { useState } from "react";

type EstimateRequest = {
  id: string;
  requestId: string;
  client: string;
  title: string;
  assignedTo: string;
  createdDate: string;
  status: "Processing" | "New";
};

const DEMO_REQUESTS: EstimateRequest[] = [
  { id: "1", requestId: "ER #2", client: "Acme Corporation", title: "Website Redesign", assignedTo: "John Smith", createdDate: "11-03-2023 02:13:46 pm", status: "Processing" },
  { id: "2", requestId: "ER #1", client: "TechStart Inc", title: "Mobile App Development", assignedTo: "Sarah Johnson", createdDate: "10-03-2023 11:45:22 am", status: "New" },
];

const STATUS_STYLES = {
  Processing: "bg-[#3b82f6] text-white",
  New: "bg-[#f59e0b] text-white",
};

export default function EstimateRequestsPage() {
  const [requests] = useState<EstimateRequest[]>(DEMO_REQUESTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const filteredRequests = requests.filter(
    (r) =>
      r.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

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
            <button className="rounded px-3 py-1.5 text-sm font-medium text-[#253445] border-b-2 border-[#253445]">Estimate Requests</button>
            <button className="rounded px-3 py-1.5 text-sm font-medium text-[#607183] hover:bg-[#f5f6f7]">Estimate Request Forms</button>
          </div>
        </div>
        <button className="inline-flex items-center gap-1 rounded border border-[#253445] px-3 py-1.5 text-sm font-medium text-[#253445]">
          <Plus size={16} /> Create estimate request
        </button>
      </div>

      {/* Section 2: Utility & Filtering Toolbar */}
      <div className="mb-3 flex items-center justify-between rounded border border-[var(--border)] p-2 text-sm text-[#607183]">
        <div className="flex items-center gap-2">
          <button className="rounded border border-[var(--border)] px-3 py-1.5 hover:bg-[#f5f6f7]">Filters</button>
          <button className="rounded-full border border-[var(--border)] px-3 py-1.5">All requests</button>
          <button className="rounded-full border border-[var(--border)] px-3 py-1.5 hover:bg-[#f5f6f7]">New</button>
          <button className="rounded-full border border-[var(--border)] px-3 py-1.5 hover:bg-[#f5f6f7]">Processing</button>
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

      {/* Section 3: Estimate Requests Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-t border-[var(--border)]">
          <thead>
            <tr>
              <th className="table-head py-2 text-left">ID</th>
              <th className="table-head py-2 text-left">Client</th>
              <th className="table-head py-2 text-left">Title</th>
              <th className="table-head py-2 text-left">
                Assigned to
                <button className="ml-1 text-[#607183]"><ArrowUpDown size={14} /></button>
              </th>
              <th className="table-head py-2 text-left">Created date</th>
              <th className="table-head py-2 text-left">
                Status
                <button className="ml-1 text-[#607183]"><ArrowUpDown size={14} /></button>
              </th>
              <th className="table-head py-2" />
            </tr>
          </thead>
          <tbody>
            {currentRequests.map((request) => (
              <tr key={request.id} className="border-t border-[var(--border)]">
                <td className="table-cell py-2">
                  <a href="#" className="text-[#4A90D9] hover:underline">{request.requestId}</a>
                </td>
                <td className="table-cell py-2">
                  <a href="#" className="text-[#4A90D9] hover:underline">{request.client}</a>
                </td>
                <td className="table-cell py-2">{request.title}</td>
                <td className="table-cell py-2">{request.assignedTo}</td>
                <td className="table-cell py-2">{request.createdDate}</td>
                <td className="table-cell py-2">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[request.status]}`}>
                    {request.status}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="text-[#607183] hover:text-[#253445]"><Eye size={16} /></button>
                    <button className="text-[#607183] hover:text-[#253445]"><MoreHorizontal size={16} /></button>
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
          <span>1-{currentRequests.length} / {filteredRequests.length}</span>
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