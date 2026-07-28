"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import LabelDropdown from "@/components/leads/LabelDropdown";

type AddLeadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (createdLead: Lead) => void;
};

type LeadForm = {
  name: string;
  contact: string;
  phone: string;
  owner: string;
  label: string;
  status: LeadStatus;
  amount: string;
  type: "organization" | "person";
  email: string;
  managers: string;
  source: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  deadline: string;
};

const STATUS_OPTIONS: LeadStatus[] = [
  "New",
  "Negotiation",
  "Discussion",
  "Qualified",
  "Won",
  "Lost",
];

const initialForm: LeadForm = {
  name: "",
  contact: "",
  phone: "",
  owner: "John Doe",
  label: "",
  status: "New",
  amount: "",
  type: "organization",
  email: "",
  managers: "",
  source: "Google",
  address: "",
  city: "",
  state: "",
  zip: "",
  deadline: "",
};

export default function AddLeadModal({ isOpen, onClose, onSave }: AddLeadModalProps) {
  const [form, setForm] = useState<LeadForm>(initialForm);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  async function handleAddLead() {
    const isPerson = form.type === "person";
    const nameToSave = isPerson ? `${firstName} ${lastName}`.trim() : form.name.trim();
    const contactToSave = isPerson ? nameToSave : form.contact.trim();

    if (!nameToSave || !contactToSave || !form.owner) {
      alert("Please fill in all required fields (Name/Company, Contact, and Owner).");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: nameToSave,
          contact: contactToSave,
          amount: Number(form.amount) || 0,
        }),
      });

      if (res.ok) {
        const created = (await res.json()) as Lead;
        onSave(created);
        setForm(initialForm);
        setFirstName("");
        setLastName("");
        onClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to create lead.");
      }
    } catch (err) {
      console.error("Failed to add lead", err);
    } finally {
      setSaving(false);
    }
  }

  const handleClose = () => {
    setForm(initialForm);
    setFirstName("");
    setLastName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Add lead</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 text-sm">
          {/* Type */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="font-medium text-gray-600">Type</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-750">
                <input 
                  type="radio" 
                  name="lead-type" 
                  checked={form.type === "organization"} 
                  onChange={() => setForm(prev => ({ ...prev, type: "organization" }))}
                  className="w-4 h-4 text-blue-600 border-gray-305 focus:ring-blue-500 cursor-pointer"
                />
                Organization
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-750">
                <input 
                  type="radio" 
                  name="lead-type" 
                  checked={form.type === "person"} 
                  onChange={() => setForm(prev => ({ ...prev, type: "person" }))}
                  className="w-4 h-4 text-blue-600 border-gray-305 focus:ring-blue-500 cursor-pointer"
                />
                Person
              </label>
            </div>
          </div>

          {/* Company name / First & Last name */}
          {form.type === "organization" ? (
            <>
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-medium text-gray-600">Company name</label>
                <input 
                  type="text"
                  placeholder="Company name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="font-medium text-gray-600">Primary contact</label>
                <input 
                  type="text"
                  placeholder="Primary contact"
                  value={form.contact}
                  onChange={(e) => setForm(prev => ({ ...prev, contact: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <label className="font-medium text-gray-600 self-center">Name</label>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <input 
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          {/* Status */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="font-medium text-gray-600">Status</label>
            <select 
              value={form.status}
              onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as LeadStatus }))}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Owner */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="font-medium text-gray-600 flex items-center gap-1.5">
              Assignee
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-gray-400 text-[10px] font-bold cursor-help" title="Select the account owner for this lead">?</span>
            </label>
            <select 
              value={form.owner}
              onChange={(e) => setForm(prev => ({ ...prev, owner: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="John Doe">John Doe</option>
              <option value="Suraj">Suraj</option>
              <option value="Jane Smith">Jane Smith</option>
              <option value="uyg">uyg</option>
            </select>
          </div>

          {/* Managers */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="font-medium text-gray-600">Managers</label>
            <input 
              type="text"
              placeholder="Managers"
              value={form.managers}
              onChange={(e) => setForm(prev => ({ ...prev, managers: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Source */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="font-medium text-gray-600">Source</label>
            <select 
              value={form.source}
              onChange={(e) => setForm(prev => ({ ...prev, source: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="Google">Google</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Direct">Direct</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Address */}
          <div className="grid grid-cols-[140px_1fr] items-start gap-4">
            <label className="font-medium text-gray-600 pt-1">Address</label>
            <textarea 
              placeholder="Address"
              rows={2}
              value={form.address}
              onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* City */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="font-medium text-gray-600">City</label>
            <input 
              type="text"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* State */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="font-medium text-gray-600">State</label>
            <input 
              type="text"
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Zip */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="font-medium text-gray-600">Zip</label>
            <input 
              type="text"
              placeholder="Zip"
              value={form.zip}
              onChange={(e) => setForm(prev => ({ ...prev, zip: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Phone */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="font-medium text-gray-600">Phone</label>
            <input 
              type="text"
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Email */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="font-medium text-gray-600">Email</label>
            <input 
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Amount */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="font-medium text-gray-600">Amount (₹)</label>
            <input 
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Deadline */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="font-medium text-gray-600">Deadline</label>
            <input 
              type="date"
              value={form.deadline}
              onChange={(e) => setForm(prev => ({ ...prev, deadline: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
            />
          </div>

          {/* Labels */}
          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="font-medium text-gray-600">Labels</label>
            <LabelDropdown
              selectedLabels={form.label}
              onChange={(labels) => setForm(prev => ({ ...prev, label: labels }))}
              placeholder="Select labels"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button 
            onClick={handleClose}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <X size={16} />
            Close
          </button>
          <button 
            onClick={handleAddLead}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            )}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
