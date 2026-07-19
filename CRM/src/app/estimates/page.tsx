"use client";

import { Plus, Search, FileText, Share2, MoreHorizontal, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";

type Estimate = {
  id: string;
  estimateNumber: string;
  client: string;
  clientId: string;
  estimateDate: string;
  createdBy: string;
  amount: number;
  status: "Accepted" | "Draft" | "Sent";
  validUntil?: string;
  gstRate?: number;
  notes?: string;
};

const DEMO_ESTIMATES: Estimate[] = [
  { id: "1", estimateNumber: "EST-001", client: "Acme Corporation", clientId: "client-1", estimateDate: "2026-04-15", createdBy: "John Smith", amount: 2500.00, status: "Sent", validUntil: "2026-05-15", gstRate: 18, notes: "Includes website development" },
  { id: "2", estimateNumber: "EST-002", client: "TechStart Inc", clientId: "client-2", estimateDate: "2026-04-18", createdBy: "Sarah Johnson", amount: 4500.00, status: "Accepted", validUntil: "2026-05-18", gstRate: 12, notes: "Mobile app project" },
  { id: "3", estimateNumber: "EST-003", client: "Global Solutions", clientId: "client-3", estimateDate: "2026-04-20", createdBy: "John Smith", amount: 1200.00, status: "Draft", validUntil: "2026-05-20", gstRate: 18 },
  { id: "4", estimateNumber: "EST-004", client: "Innovate Labs", clientId: "client-4", estimateDate: "2026-04-21", createdBy: "Mike Wilson", amount: 3200.00, status: "Sent", validUntil: "2026-05-21", gstRate: 12, notes: "SEO optimization package" },
  { id: "5", estimateNumber: "EST-005", client: "Bright Future Co", clientId: "client-5", estimateDate: "2026-04-22", createdBy: "Sarah Johnson", amount: 1800.00, status: "Accepted", validUntil: "2026-05-22", gstRate: 18 },
  { id: "6", estimateNumber: "EST-006", client: "Peak Performance", clientId: "client-6", estimateDate: "2026-04-23", createdBy: "John Smith", amount: 5500.00, status: "Draft", validUntil: "2026-05-23", gstRate: 18, notes: "Full digital marketing" },
  { id: "7", estimateNumber: "EST-007", client: "Summit Enterprises", clientId: "client-7", estimateDate: "2026-04-24", createdBy: "Mike Wilson", amount: 2100.00, status: "Sent", validUntil: "2026-05-24", gstRate: 12 },
  { id: "8", estimateNumber: "EST-008", client: "Vertex Group", clientId: "client-8", estimateDate: "2026-04-25", createdBy: "Sarah Johnson", amount: 3800.00, status: "Accepted", validUntil: "2026-05-25", gstRate: 18, notes: "E-commerce setup" },
  { id: "9", estimateNumber: "EST-009", client: "Horizon Digital", clientId: "client-9", estimateDate: "2026-04-25", createdBy: "John Smith", amount: 1650.00, status: "Draft", validUntil: "2026-05-25", gstRate: 18 },
  { id: "10", estimateNumber: "EST-010", client: "Apex Solutions", clientId: "client-10", estimateDate: "2026-04-26", createdBy: "Mike Wilson", amount: 4200.00, status: "Sent", validUntil: "2026-05-26", gstRate: 12, notes: "Cloud migration" },
];

const STATUS_STYLES = {
  Accepted: "bg-[#4A90D9] text-white",
  Draft: "bg-[#6b7280] text-white",
  Sent: "bg-[#93c5fd] text-[#1e40af]",
};

const GST_OPTIONS = [
  { value: 18, label: "18%" },
  { value: 12, label: "12%" },
];

export default function EstimatesPage() {
  const [estimates] = useState<Estimate[]>(DEMO_ESTIMATES);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredEstimates = estimates.filter(
    (e) =>
      e.estimateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = filteredEstimates.reduce((sum, e) => sum + e.amount, 0);
  const totalAllPages = estimates.reduce((sum, e) => sum + e.amount, 0);

  const totalPages = Math.ceil(filteredEstimates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEstimates = filteredEstimates.slice(startIndex, startIndex + itemsPerPage);
  const currentTotal = currentEstimates.reduce((sum, e) => sum + e.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="card p-3">
      {/* Section 1: Global Navigation & Primary Action */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded p-1 hover:bg-[#f5f6f7]">
            {sidebarOpen ? <PanelLeftClose size={18} className="text-[#607183]" /> : <PanelLeftOpen size={18} className="text-[#607183]" />}
          </button>
          <div className="flex gap-1">
            <button className="rounded px-3 py-1.5 text-sm font-medium text-[#253445]">Estimates</button>
            <button className="rounded px-3 py-1.5 text-sm font-medium text-[#607183] hover:bg-[#f5f6f7]">Estimate Requests</button>
            <button className="rounded px-3 py-1.5 text-sm font-medium text-[#607183] hover:bg-[#f5f6f7]">Estimate Request Forms</button>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-1 rounded border border-[#253445] px-3 py-1.5 text-sm font-medium text-[#253445]">
          <Plus size={16} /> Add estimate
        </button>
      </div>

      {/* Section 2: Utility & Filtering Tools */}
      <div className="mb-3 flex items-center justify-between rounded border border-[var(--border)] p-2 text-sm text-[#607183]">
        <div className="flex items-center gap-2">
          <button className="rounded border border-[var(--border)] px-3 py-1.5 hover:bg-[#f5f6f7]">Filters</button>
          <button className="rounded-full border border-[var(--border)] px-3 py-1.5">All estimates</button>
          <button className="rounded-full border border-[var(--border)] px-3 py-1.5 hover:bg-[#f5f6f7]">Accepted</button>
          <button className="rounded-full border border-[var(--border)] px-3 py-1.5 hover:bg-[#f5f6f7]">Draft</button>
          <button className="rounded-full border border-[var(--border)] px-3 py-1.5 hover:bg-[#f5f6f7]">Sent</button>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-[#607183] hover:text-[#253445]">Excel</button>
          <button className="text-[#607183] hover:text-[#253445]">Print</button>
          <div className="relative">
            <Search size={14} className="absolute left-2 top-2 text-[#93a2b4]" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded border border-[var(--border)] py-1.5 pl-7 pr-3 text-sm w-48"
              placeholder="Search estimates..."
            />
          </div>
        </div>
      </div>

      {/* Section 3: Estimates Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-t border-[var(--border)]">
          <thead>
            <tr>
              <th className="table-head py-2 text-left">Estimate (#)</th>
              <th className="table-head py-2 text-left">Client</th>
              <th className="table-head py-2 text-left">Estimate Date</th>
              <th className="table-head py-2 text-left">Valid Until</th>
              <th className="table-head py-2 text-left">Created By</th>
              <th className="table-head py-2 text-right">Amount (₹)</th>
              <th className="table-head py-2 text-center">GST</th>
              <th className="table-head py-2 text-left">Status</th>
              <th className="table-head py-2" />
            </tr>
          </thead>
          <tbody>
            {currentEstimates.map((estimate) => (
              <tr key={estimate.id} className="border-t border-[var(--border)]">
                <td className="table-cell py-2">
                  <a href="#" className="text-[#4A90D9] hover:underline">{estimate.estimateNumber}</a>
                </td>
                <td className="table-cell py-2">
                  <a href="#" className="text-[#4A90D9] hover:underline">{estimate.client}</a>
                </td>
                <td className="table-cell py-2">{estimate.estimateDate}</td>
                <td className="table-cell py-2">{estimate.validUntil || "-"}</td>
                <td className="table-cell py-2">{estimate.createdBy}</td>
                <td className="table-cell py-2 text-right font-medium">₹{estimate.amount.toLocaleString("en-IN")}</td>
                <td className="table-cell py-2 text-center">
                  <span className="inline-block rounded bg-[#e7edf3] px-2 py-0.5 text-xs text-[#607183]">
                    {estimate.gstRate ? `${estimate.gstRate}%` : "-"}
                  </span>
                </td>
                <td className="table-cell py-2">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[estimate.status]}`}>
                    {estimate.status}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="text-[#607183] hover:text-[#253445]"><FileText size={16} /></button>
                    <button className="text-[#607183] hover:text-[#253445]"><Share2 size={16} /></button>
                    <button className="text-[#607183] hover:text-[#253445]"><MoreHorizontal size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 4: Financial Summary & Totals */}
      <div className="border-t border-[var(--border)]">
        <div className="flex justify-end py-2">
          <div className="flex w-64 justify-between text-sm">
            <span className="text-[#607183]">Total (Current View):</span>
            <span className="font-semibold text-[#253445]">₹{currentTotal.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <div className="flex justify-end border-t border-[var(--border)] py-2">
          <div className="flex w-64 justify-between text-sm">
            <span className="text-[#607183]">Total of all pages:</span>
            <span className="font-semibold text-[#253445]">₹{totalAllPages.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Section 5: Pagination & View Settings */}
      <div className="mt-3 flex items-center justify-between text-sm text-[#718194]">
        <div className="flex items-center gap-2">
          <select 
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded border border-[var(--border)] px-2 py-1"
          >
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
          <span>{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredEstimates.length)} / {filteredEstimates.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[#f5f6f7] disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`rounded border border-[var(--border)] px-2 py-1 ${
                currentPage === page ? "bg-[#253445] text-white" : "hover:bg-[#f5f6f7]"
              }`}
            >
              {page}
            </button>
          ))}
          <button 
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[#f5f6f7] disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Add Estimate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-[#253445]">Create New Estimate</h2>
            <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }}>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#607183]">Client Name *</label>
                  <input 
                    type="text" 
                    required
                    className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" 
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#607183]">Estimate Date</label>
                    <input type="date" className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[#607183]">Valid Until *</label>
                    <input type="date" required className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#607183]">Amount (₹) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required
                    className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" 
                    placeholder="₹0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#607183]">GST Rate *</label>
                  <select required className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm">
                    <option value="">Select GST rate</option>
                    {GST_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#607183]">Status</label>
                  <select className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm">
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#607183]">Notes</label>
                  <textarea 
                    className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" 
                    rows={3}
                    placeholder="Add any additional notes..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded border border-[var(--border)] px-4 py-2 text-sm text-[#607183] hover:bg-[#f5f6f7]">Cancel</button>
                <button type="submit" className="rounded bg-[#253445] px-4 py-2 text-sm text-white hover:bg-[#1a2530]">Create Estimate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}