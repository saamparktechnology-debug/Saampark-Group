"use client";

import React, { useState } from "react";
import { Plus, Trash2, Printer, Edit3, ArrowLeft, FileText } from "lucide-react";
import type { Lead } from "@/lib/types";

interface DocumentItem {
  id: string;
  item: string;
  description: string;
  quantity: string;
  rate: number;
  total: number;
}

interface GenericDocument {
  id: string;
  docNumber: string; // mapped from estimateNumber, proposalNumber, contractNumber
  status: "Draft" | "Sent" | "Accepted" | "Declined";
  date: string;
  validUntil: string;
  items: DocumentItem[];
  discount: number;
  tax: number;
}

interface DocumentTabProps {
  lead: Lead;
  type: "Estimate" | "Proposal" | "Contract";
  onUpdateLead: (updatedLead: Lead) => Promise<void>;
}

export default function DocumentTab({ lead, type, onUpdateLead }: DocumentTabProps) {
  const [view, setView] = useState<"list" | "edit" | "print">("list");
  const [editingDoc, setEditingDoc] = useState<GenericDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Map type to database field names
  const listKey = (type === "Estimate"
    ? "estimatesList"
    : type === "Proposal"
    ? "proposalsList"
    : "contractsList") as "estimatesList" | "proposalsList" | "contractsList";

  const numKey = (type === "Estimate"
    ? "estimateNumber"
    : type === "Proposal"
    ? "proposalNumber"
    : "contractNumber") as "estimateNumber" | "proposalNumber" | "contractNumber";

  interface RawDocument {
    id: string;
    estimateNumber?: string;
    proposalNumber?: string;
    contractNumber?: string;
    status: "Draft" | "Sent" | "Accepted" | "Declined";
    date: string;
    validUntil: string;
    items: DocumentItem[];
    discount: number;
    tax: number;
  }

  // Get current documents from the lead
  const rawDocs = (lead[listKey] || []) as RawDocument[];

  // Standardize the documents for our components
  const documents: GenericDocument[] = rawDocs.map((doc: RawDocument) => ({
    id: doc.id,
    docNumber: doc[numKey] || "",
    status: doc.status || "Draft",
    date: doc.date || new Date().toISOString().split("T")[0],
    validUntil: doc.validUntil || "",
    items: doc.items || [],
    discount: doc.discount ?? 0,
    tax: doc.tax ?? 10,
  }));

  // Handle deleting a document
  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.toLowerCase()}?`)) return;

    const updatedList = rawDocs.filter((doc: RawDocument) => doc.id !== id);
    const updatedLead = {
      ...lead,
      [listKey]: updatedList,
    };

    try {
      await onUpdateLead(updatedLead);
    } catch (err) {
      console.error("Failed to delete document", err);
      alert("Error deleting document");
    }
  };

  // Switch to creation mode
  const handleCreateNew = () => {
    const nextNumber = `${type.toUpperCase().substring(0, 3)}-${new Date().getFullYear()}-${String(
      documents.length + 1
    ).padStart(3, "0")}`;

    const defaultValid = new Date();
    defaultValid.setDate(defaultValid.getDate() + 30);

    const newDoc: GenericDocument = {
      id: Math.random().toString(36).substring(2, 9),
      docNumber: nextNumber,
      status: "Draft",
      date: new Date().toISOString().split("T")[0],
      validUntil: defaultValid.toISOString().split("T")[0],
      items: [
        {
          id: Math.random().toString(36).substring(2, 9),
          item: "",
          description: "",
          quantity: "1",
          rate: 0,
          total: 0,
        },
      ],
      discount: 0,
      tax: 10,
    };

    setEditingDoc(newDoc);
    setView("edit");
  };

  // Switch to edit mode
  const handleEdit = (doc: GenericDocument) => {
    setEditingDoc(JSON.parse(JSON.stringify(doc))); // deep clone
    setView("edit");
  };

  // Switch to print view
  const handlePrintPreview = (doc: GenericDocument) => {
    setEditingDoc(doc);
    setView("print");
  };

  // Save the document (Create or Update)
  const handleSave = async () => {
    if (!editingDoc) return;
    if (!editingDoc.docNumber.trim()) {
      alert("Please specify a document number.");
      return;
    }

    setIsSaving(true);
    // Map generic back to type specific shape
    const formattedDoc = {
      id: editingDoc.id,
      [numKey]: editingDoc.docNumber,
      status: editingDoc.status,
      date: editingDoc.date,
      validUntil: editingDoc.validUntil,
      items: editingDoc.items,
      discount: editingDoc.discount,
      tax: editingDoc.tax,
    };

    let updatedList;
    const existingIndex = rawDocs.findIndex((d: RawDocument) => d.id === editingDoc.id);
    if (existingIndex > -1) {
      // Update
      updatedList = [...rawDocs];
      updatedList[existingIndex] = formattedDoc;
    } else {
      // Create
      updatedList = [...rawDocs, formattedDoc];
    }

    const updatedLead = {
      ...lead,
      [listKey]: updatedList,
    };

    try {
      await onUpdateLead(updatedLead);
      setView("list");
      setEditingDoc(null);
    } catch (err) {
      console.error("Failed to save document", err);
      alert("Error saving document");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate totals
  const getSubtotal = (items: DocumentItem[]) => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const r = item.rate || 0;
      return sum + q * r;
    }, 0);
  };

  const getTotals = (doc: GenericDocument) => {
    const subtotal = getSubtotal(doc.items);
    const discountAmt = subtotal * (doc.discount / 100);
    const taxable = subtotal - discountAmt;
    const taxAmt = taxable * (doc.tax / 100);
    const total = taxable + taxAmt;
    return { subtotal, discountAmt, taxable, taxAmt, total };
  };

  // Status badges mapping
  const statusBadges: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-700 border-gray-200",
    Sent: "bg-blue-50 text-blue-700 border-blue-100",
    Accepted: "bg-green-50 text-green-700 border-green-100",
    Declined: "bg-red-50 text-red-700 border-red-100",
  };

  if (view === "print" && editingDoc) {
    const { subtotal, discountAmt, taxAmt, total } = getTotals(editingDoc);

    return (
      <div className="bg-white min-h-screen p-6 relative">
        {/* Style block for print isolation */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background: white;
              color: black;
            }
            .no-print {
              display: none !important;
            }
            .print-sheet {
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
            }
          }
        `}} />

        {/* Print Controls (Hidden on Print) */}
        <div className="no-print flex justify-between items-center mb-6 border-b border-gray-200 pb-4 bg-gray-50 -mx-6 -mt-6 p-4">
          <button
            onClick={() => setView("list")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} /> Back to List
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors shadow"
            >
              <Printer size={16} /> Print / Export PDF
            </button>
          </div>
        </div>

        {/* Invoice Page Sheet Layout */}
        <div className="print-sheet max-w-4xl mx-auto bg-white border border-gray-300 rounded-xl shadow-lg p-8 md:p-12 text-gray-800">
          {/* Header Row */}
          <div className="flex justify-between items-start gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">
                SAAMPARK
              </h1>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">
                SAAMPARK Technology & Research Pvt. Ltd.
              </p>
              <div className="text-xs text-gray-600 space-y-0.5">
                <p>123, Tech Business Park, Sector 62</p>
                <p>Noida, Uttar Pradesh, 201301</p>
                <p>Email: finance@saampark.com | Web: www.saampark.com</p>
                <p>Phone: +91 120 4567890</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/saampark_logo.jpeg"
                alt="SAAMPARK Logo"
                className="h-16 w-auto object-contain border border-gray-100 rounded bg-white p-1 mb-2"
              />
              <span className="inline-block px-3 py-1 rounded text-xs font-bold uppercase border bg-gray-50 text-gray-800">
                {type} Document
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 border-t border-b border-gray-100 py-6 mb-8 text-sm">
            {/* Lead Info */}
            <div>
              <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-wider mb-2">
                Billed To / Client
              </h3>
              <div className="font-bold text-gray-900 text-base mb-1">{lead.name}</div>
              {lead.type === "organization" && (
                <div className="text-gray-500 text-xs font-semibold mb-2">Organization</div>
              )}
              <div className="text-xs text-gray-600 space-y-1">
                {lead.contact && <p><span className="text-gray-400">Primary Contact:</span> {lead.contact}</p>}
                {lead.email && <p><span className="text-gray-400">Email:</span> {lead.email}</p>}
                {lead.phone && <p><span className="text-gray-400">Phone:</span> {lead.phone}</p>}
                {lead.address && (
                  <p className="max-w-xs mt-1">
                    <span className="text-gray-400">Address:</span> {lead.address}
                    {lead.city && `, ${lead.city}`}
                    {lead.state && `, ${lead.state}`}
                    {lead.zip && ` - ${lead.zip}`}
                  </p>
                )}
              </div>
            </div>

            {/* Document metadata */}
            <div className="text-right flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-wider mb-2">
                  Document Details
                </h3>
                <table className="ml-auto text-xs text-left border-collapse">
                  <tbody>
                    <tr>
                      <td className="pr-4 py-1 text-gray-400 font-semibold">{type} #:</td>
                      <td className="py-1 text-gray-900 font-bold">{editingDoc.docNumber}</td>
                    </tr>
                    <tr>
                      <td className="pr-4 py-1 text-gray-400 font-semibold">Date:</td>
                      <td className="py-1 text-gray-900 font-semibold">{editingDoc.date}</td>
                    </tr>
                    {editingDoc.validUntil && (
                      <tr>
                        <td className="pr-4 py-1 text-gray-400 font-semibold">Valid Until:</td>
                        <td className="py-1 text-gray-900 font-semibold">{editingDoc.validUntil}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="pr-4 py-1 text-gray-400 font-semibold">Status:</td>
                      <td className="py-1 text-gray-900 font-bold">{editingDoc.status}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse mb-8 text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="px-4 py-3">Item / Service</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {editingDoc.items.map((item, idx) => {
                const q = parseFloat(item.quantity) || 0;
                return (
                  <tr key={item.id || idx} className="text-gray-700">
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.item || "-"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs">{item.description || "-"}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      {item.rate.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {(q * item.rate).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="flex justify-end mb-12">
            <div className="w-full max-w-xs text-sm space-y-2">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-gray-800">
                  {subtotal.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                </span>
              </div>
              {editingDoc.discount > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Discount ({editingDoc.discount}%):</span>
                  <span className="font-semibold text-green-600">
                    -{discountAmt.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Tax (10%):</span>
                <span className="font-semibold text-gray-800">
                  {taxAmt.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                </span>
              </div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between text-base font-extrabold text-gray-900">
                <span>Total Amount:</span>
                <span>
                  {total.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                </span>
              </div>
            </div>
          </div>

          {/* Terms / Sign off */}
          <div className="border-t border-gray-100 pt-8 mt-12 grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <h4 className="font-bold text-gray-700 mb-1 uppercase tracking-wider text-[9px]">Terms & Conditions</h4>
              <p>1. Payment terms: 50% advance, balance upon project milestones.</p>
              <p>2. This estimate is valid for 30 days from the date of generation.</p>
              <p>3. All disputes are subject to local jurisdictions.</p>
            </div>
            <div className="text-right flex flex-col justify-end items-end h-24">
              <div className="border-b border-gray-300 w-40 mb-1"></div>
              <p className="font-semibold text-gray-700">Authorized Signatory</p>
              <p className="text-[10px]">SAAMPARK Tech & Research</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "edit" && editingDoc) {
    const { subtotal, discountAmt, taxable, taxAmt, total } = getTotals(editingDoc);

    const handleAddItem = () => {
      setEditingDoc({
        ...editingDoc,
        items: [
          ...editingDoc.items,
          {
            id: Math.random().toString(36).substring(2, 9),
            item: "",
            description: "",
            quantity: "1",
            rate: 0,
            total: 0,
          },
        ],
      });
    };

    const handleRemoveItem = (index: number) => {
      if (editingDoc.items.length <= 1) return;
      const updated = editingDoc.items.filter((_, i) => i !== index);
      setEditingDoc({ ...editingDoc, items: updated });
    };

    const handleItemChange = (index: number, field: keyof DocumentItem, value: string | number) => {
      const updatedItems = [...editingDoc.items];
      const item = { ...updatedItems[index] };

      if (field === "item") {
        item.item = String(value);
      } else if (field === "description") {
        item.description = String(value);
      } else if (field === "quantity") {
        item.quantity = String(value);
        const q = parseFloat(String(value)) || 0;
        item.total = q * item.rate;
      } else if (field === "rate") {
        const rateVal = typeof value === "number" ? value : parseFloat(value) || 0;
        item.rate = rateVal;
        const q = parseFloat(item.quantity) || 0;
        item.total = q * rateVal;
      }

      updatedItems[index] = item;
      setEditingDoc({ ...editingDoc, items: updatedItems });
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 max-w-5xl mx-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("list")}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <h3 className="font-bold text-gray-800 text-base">
              {editingDoc.id ? `Edit ${type}` : `Create ${type}`}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView("list")}
              className="px-3.5 py-1.5 text-xs font-semibold border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors shadow-sm disabled:bg-indigo-300"
            >
              {isSaving ? "Saving..." : "Save Document"}
            </button>
          </div>
        </div>

        {/* Basic metadata */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Document Number
            </label>
            <input
              type="text"
              value={editingDoc.docNumber}
              onChange={(e) => setEditingDoc({ ...editingDoc, docNumber: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              value={editingDoc.date}
              onChange={(e) => setEditingDoc({ ...editingDoc, date: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Valid Until
            </label>
            <input
              type="date"
              value={editingDoc.validUntil}
              onChange={(e) => setEditingDoc({ ...editingDoc, validUntil: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={editingDoc.status}
              onChange={(e) =>
                setEditingDoc({
                  ...editingDoc,
                  status: e.target.value as GenericDocument["status"],
                })
              }
              className="w-full text-sm border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Declined">Declined</option>
            </select>
          </div>
        </div>

        {/* Item Rows */}
        <div className="mb-6">
          <h4 className="font-bold text-sm text-gray-800 mb-3 border-b border-gray-100 pb-1">Line Items</h4>
          <div className="space-y-3">
            {editingDoc.items.map((item, index) => (
              <div key={item.id || index} className="flex flex-col md:flex-row items-start gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Item Name</label>
                  <input
                    type="text"
                    value={item.item}
                    onChange={(e) => handleItemChange(index, "item", e.target.value)}
                    placeholder="Item / Service Name"
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none"
                  />
                </div>
                <div className="flex-[2] w-full">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    placeholder="Short description"
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none"
                  />
                </div>
                <div className="w-full md:w-20">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Qty</label>
                  <input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    placeholder="1"
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-center focus:outline-none"
                  />
                </div>
                <div className="w-full md:w-28">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Rate (₹)</label>
                  <input
                    type="number"
                    value={item.rate || ""}
                    onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                    placeholder="0"
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-right focus:outline-none"
                  />
                </div>
                <div className="w-full md:w-28 text-right self-center pt-4 md:pt-0">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase md:hidden mb-0.5">Total</span>
                  <span className="text-xs font-semibold text-gray-800 pr-2">
                    {((parseFloat(item.quantity) || 0) * (item.rate || 0)).toLocaleString("en-IN", {
                      style: "currency",
                      currency: "INR",
                    })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  disabled={editingDoc.items.length <= 1}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors self-center mt-3 md:mt-0 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
          >
            <Plus size={14} /> Add Line Item
          </button>
        </div>

        {/* Computations Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-5">
          <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 self-start">
            <h5 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-2">Discount & Tax Settings</h5>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Discount Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingDoc.discount || ""}
                  onChange={(e) =>
                    setEditingDoc({
                      ...editingDoc,
                      discount: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                    })
                  }
                  className="w-24 text-sm border border-gray-300 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tax Rate (%)</label>
                <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded inline-block">
                  {editingDoc.tax}% (Fixed)
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h5 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-3">Calculations</h5>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-gray-800">
                  {subtotal.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                </span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount ({editingDoc.discount}%):</span>
                  <span className="font-semibold text-green-600">
                    -{discountAmt.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                  </span>
                </div>
              )}
              {discountAmt > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Taxable Amount:</span>
                  <span className="font-medium">
                    {taxable.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Tax ({editingDoc.tax}%):</span>
                <span className="font-semibold text-gray-800">
                  {taxAmt.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                </span>
              </div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between text-sm font-bold text-gray-900">
                <span>Total Amount:</span>
                <span>
                  {total.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW (Default)
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="text-indigo-600 w-5 h-5" />
          <h3 className="font-semibold text-gray-800 text-sm md:text-base">{type}s</h3>
        </div>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={14} /> Create {type}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-[10px] text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100 font-bold tracking-wider">
            <tr>
              <th className="px-4 py-3">{type} #</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Valid Until</th>
              <th className="px-4 py-3 text-right">Items</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-xs italic">
                  No {type.toLowerCase()}s found. Click &quot;Create {type}&quot; to get started.
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const { total } = getTotals(doc);
                return (
                  <tr key={doc.id} className="hover:bg-gray-50/30 transition-colors text-gray-700">
                    <td className="px-4 py-3 font-semibold text-indigo-600">{doc.docNumber}</td>
                    <td className="px-4 py-3 text-xs">{doc.date}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{doc.validUntil || "-"}</td>
                    <td className="px-4 py-3 text-right text-xs font-medium">{doc.items.length}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {total.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadges[doc.status] || "bg-gray-100"}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePrintPreview(doc)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Print / View PDF"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          onClick={() => handleEdit(doc)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
