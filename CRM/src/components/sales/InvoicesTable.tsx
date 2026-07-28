"use client";

import { useState } from "react";
import { PlusCircle, Mail, Edit3 } from "lucide-react";

type Invoice = {
  id: string;
  client: string;
  project: string;
  billDate: string;
  dueDate: string;
  total: number;
  received: number;
  status: string;
  email: string;
  notes?: string;
};

const initialInvoices: Invoice[] = [
  { id: "INV #28", client: "Demo Client", project: "Product Photography and Cataloging", billDate: "2026-02-17", dueDate: "-", total: -500, received: 0, status: "Draft", email: "demo@example.com" },
  { id: "INV #27", client: "Fritsch, Okuneva and Armstrong", project: "Social Media Marketing Campaign", billDate: "2026-02-12", dueDate: "2026-02-26", total: 120, received: 0, status: "Draft", email: "marketing@example.com" },
  { id: "INV #23", client: "Adrain Ondricka", project: "Podcast Production and Editing", billDate: "2026-02-11", dueDate: "2026-02-25", total: 90, received: 90, status: "Fully paid", email: "adrain@example.com" },
  { id: "INV #22", client: "Abshire-Swaniawski", project: "SEO Optimization Strategy", billDate: "2026-02-08", dueDate: "2026-02-22", total: 360, received: 360, status: "Fully paid", email: "seo@example.com" },
  { id: "INV #21", client: "Demo Client", project: "Product Photography and Cataloging", billDate: "2026-02-10", dueDate: "2026-02-22", total: 500, received: 0, status: "Credited", email: "demo@example.com" },
  { id: "INV #19", client: "Janice Quigley", project: "E-commerce Website Design", billDate: "2026-02-09", dueDate: "2026-02-21", total: 90, received: 0, status: "Not paid", email: "janice@example.com" },
  { id: "INV #15", client: "Adrain Ondricka", project: "Social Media Content Calendar", billDate: "2026-02-08", dueDate: "2026-02-22", total: 90, received: 90, status: "Fully paid", email: "adrain@example.com" },
  { id: "INV #13", client: "Fritsch, Okuneva and Armstrong", project: "Social Media Marketing Campaign", billDate: "2026-02-13", dueDate: "2026-02-27", total: 1000, received: 0, status: "Not paid", email: "marketing@example.com" },
  { id: "INV #10", client: "Demo Client", project: "Product Photography and Cataloging", billDate: "2026-02-11", dueDate: "2026-02-09", total: 66, received: 0, status: "Overdue", email: "demo@example.com" },
  { id: "INV #9", client: "Demo Client", project: "Product Photography and Cataloging", billDate: "2026-02-03", dueDate: "2026-02-17", total: 100, received: 0, status: "Not paid", email: "demo@example.com" },
];

const STATUS_OPTIONS = [
  "Draft",
  "Sent",
  "Not paid",
  "Overdue",
  "Fully paid",
  "Credited",
];

const getStatusClass = (status: string) => {
  switch (status) {
    case "Draft":
      return "bg-[#707787] text-white";
    case "Sent":
      return "bg-[#93c5fd] text-[#1e40af]";
    case "Not paid":
      return "bg-[#f3b61f] text-white";
    case "Overdue":
      return "bg-[#ef4d6d] text-white";
    case "Fully paid":
      return "bg-[#5a677f] text-white";
    case "Credited":
      return "bg-[#ef4d6d] text-white";
    default:
      return "bg-[#e2e8f0] text-[#334457]";
  }
};

const blankForm = {
  client: "",
  project: "",
  billDate: "",
  dueDate: "",
  total: "",
  received: "",
  status: "Draft",
  email: "",
  notes: "",
};

export default function InvoicesTable() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState({ ...blankForm });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalReceived = invoices.reduce((sum, inv) => sum + inv.received, 0);
  const totalDue = totalInvoiced - totalReceived;

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });

  const openAddModal = () => {
    setEditingInvoice(null);
    setForm({ ...blankForm });
    setShowModal(true);
  };

  const openEditModal = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setForm({
      client: invoice.client,
      project: invoice.project,
      billDate: invoice.billDate === "-" ? "" : invoice.billDate,
      dueDate: invoice.dueDate === "-" ? "" : invoice.dueDate,
      total: invoice.total.toString(),
      received: invoice.received.toString(),
      status: invoice.status,
      email: invoice.email,
      notes: invoice.notes ?? "",
    });
    setShowModal(true);
  };

  const sendInvoice = (invoiceId: string) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice) return;
    const subject = `Invoice ${invoice.id} - ${invoice.project}`;
    const body = `Dear ${invoice.client},\n\nPlease find attached the invoice ${invoice.id} for ${invoice.project}.\n\nTotal Amount: ${formatCurrency(invoice.total)}\nDue Date: ${invoice.dueDate}\n\nBest regards,\nYour Company`;
    const mailtoUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(invoice.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  const saveInvoice = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const savedInvoice: Invoice = {
      id: editingInvoice ? editingInvoice.id : `INV #${Math.floor(100 + Math.random() * 900)}`,
      client: form.client,
      project: form.project,
      billDate: form.billDate || "-",
      dueDate: form.dueDate || "-",
      total: Number(form.total) || 0,
      received: Number(form.received) || 0,
      status: form.status,
      email: form.email,
      notes: form.notes,
    };

    setInvoices((prev) => {
      if (editingInvoice) {
        return prev.map((item) => (item.id === editingInvoice.id ? savedInvoice : item));
      }
      return [savedInvoice, ...prev];
    });

    setShowModal(false);
  };

  return (
    <div className="card p-3">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-[#334457]">Invoices</h2>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded border border-[#253445] bg-white px-4 py-2 text-sm font-medium text-[#253445] hover:bg-[#f5f6f7]"
        >
          <PlusCircle size={16} /> Add invoice
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-t border-[var(--border)]">
          <thead>
            <tr>
              <th className="py-2 text-left">Invoice ID</th>
              <th className="py-2 text-left">Client</th>
              <th className="py-2 text-left">Project</th>
              <th className="py-2 text-left">Bill date</th>
              <th className="py-2 text-left">Due date</th>
              <th className="py-2 text-left">Total</th>
              <th className="py-2 text-left">Received</th>
              <th className="py-2 text-left">Due</th>
              <th className="py-2 text-left">Status</th>
              <th className="py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const due = inv.total - inv.received;
              return (
                <tr key={inv.id} className="border-t border-[var(--border)]">
                  <td className="py-2">{inv.id}</td>
                  <td className="py-2">{inv.client}</td>
                  <td className="py-2">{inv.project}</td>
                  <td className="py-2">{inv.billDate}</td>
                  <td className="py-2">{inv.dueDate}</td>
                  <td className="py-2">{formatCurrency(inv.total)}</td>
                  <td className="py-2">{formatCurrency(inv.received)}</td>
                  <td className="py-2">{formatCurrency(due)}</td>
                  <td className="py-2">
                    <div className="flex flex-col gap-2">
                      <span className={`rounded px-2 py-0.5 text-[11px] ${getStatusClass(inv.status)}`}>
                        {inv.status}
                      </span>
                      <button
                        onClick={() => sendInvoice(inv.id)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-[#1d4ed8] hover:bg-[#eff6ff]"
                      >
                        <Mail size={12} /> Send
                      </button>
                    </div>
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => openEditModal(inv)}
                      className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-3 py-1 text-sm text-[#334457] hover:bg-[#f5f6f7]"
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr className="border-t border-[var(--border)] font-semibold">
              <td colSpan={5}></td>
              <td className="py-2">{formatCurrency(totalInvoiced)}</td>
              <td className="py-2">{formatCurrency(totalReceived)}</td>
              <td className="py-2">{formatCurrency(totalDue)}</td>
              <td className="py-2">Total</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#334457]">
                {editingInvoice ? "Edit Invoice" : "Add Invoice"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-sm text-[#607183] hover:text-[#334457]">
                Close
              </button>
            </div>
            <form onSubmit={saveInvoice} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-[#607183]">
                  <span>Client</span>
                  <input
                    type="text"
                    value={form.client}
                    onChange={(e) => setForm((prev) => ({ ...prev, client: e.target.value }))}
                    required
                    className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-2 text-sm text-[#607183]">
                  <span>Project</span>
                  <input
                    type="text"
                    value={form.project}
                    onChange={(e) => setForm((prev) => ({ ...prev, project: e.target.value }))}
                    required
                    className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2 text-sm text-[#607183]">
                  <span>Bill date</span>
                  <input
                    type="date"
                    value={form.billDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, billDate: e.target.value }))}
                    className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-2 text-sm text-[#607183]">
                  <span>Due date</span>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-2 text-sm text-[#607183]">
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    {STATUS_OPTIONS.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2 text-sm text-[#607183]">
                  <span>Total</span>
                  <input
                    type="number"
                    value={form.total}
                    onChange={(e) => setForm((prev) => ({ ...prev, total: e.target.value }))}
                    className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-2 text-sm text-[#607183]">
                  <span>Received</span>
                  <input
                    type="number"
                    value={form.received}
                    onChange={(e) => setForm((prev) => ({ ...prev, received: e.target.value }))}
                    className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-2 text-sm text-[#607183]">
                  <span>Customer email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm text-[#607183]">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm"
                />
              </label>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded border border-[var(--border)] px-4 py-2 text-sm text-[#607183] hover:bg-[#f5f6f7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-[#253445] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a2530]"
                >
                  {editingInvoice ? "Save invoice" : "Create invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
