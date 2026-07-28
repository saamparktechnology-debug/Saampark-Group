"use client";

import Image from "next/image";
import { 
  PlusCircle, Trash2, Pencil, Users, Contact2, LogIn, CalendarDays, 
  CheckCircle2, PlayCircle, FolderOpen, Coffee, XCircle, Receipt, 
  Ticket, ShoppingCart, Search, LayoutGrid, List as ListIcon, Filter, 
  FileSpreadsheet, Printer 
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

type Contact = {
  _id?: string;
  name: string;
  client: string;
  title: string;
  email: string;
  phone: string;
  group: string;
  invoiced: number;
  received: number;
};

const groupColors: Record<string, string> = {
  Gold: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Silver: "bg-gray-100 text-gray-800 border-gray-200",
  VIP: "bg-purple-100 text-purple-800 border-purple-200"
};

export default function ClientsTable() {
  const [activeTab, setActiveTab] = useState<"overview" | "clients">("overview");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState<Contact>({
    name: "",
    client: "",
    title: "",
    email: "",
    phone: "",
    group: "Silver",
    invoiced: 0,
    received: 0
  });

  // LOAD
  useEffect(() => {
    fetch("/api/clients")
      .then(res => res.json())
      .then(data => setContacts(Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to fetch clients", err));
  }, []);

  // SAVE
  const saveClient = async () => {
    if (!form.name || !form.email) {
      alert("Name & Email required");
      return;
    }

    if (editIndex !== null) {
      const updated = [...contacts];
      updated[editIndex] = form;
      setContacts(updated);
      setEditIndex(null);
    } else {
      try {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify(form)
        });
        const result = await res.json();
        setContacts([...contacts, { ...form, _id: result.insertedId }]);
      } catch (err) {
        console.error("Failed to save client", err);
      }
    }

    setForm({
      name:"",
      client:"",
      title:"",
      email:"",
      phone:"",
      group:"Silver",
      invoiced:0,
      received:0
    });
    setShowForm(false);
  };

  const editClient = (index: number) => {
    setForm(contacts[index]);
    setEditIndex(index);
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (deleteIndex === null) return;
    const contact = contacts[deleteIndex];

    try {
      await fetch("/api/clients/delete", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ email: contact.email })
      });
      setContacts(contacts.filter((_, i) => i !== deleteIndex));
    } catch (err) {
      console.error("Failed to delete client", err);
    }
    setDeleteIndex(null);
  };

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(c => 
      `${c.name} ${c.client} ${c.email} ${c.group}`.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#f8fafc] rounded-lg shadow-sm border border-gray-200 w-full min-h-screen text-gray-800">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-2 bg-white px-4 pt-4 rounded-t-lg">
        <div className="flex space-x-1">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "overview" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab("clients")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "clients" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Clients
          </button>
        </div>

        {activeTab === "clients" && (
          <div className="flex items-center flex-wrap gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                className="border border-gray-300 rounded-md py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={() => {
                setEditIndex(null);
                setForm({name:"", client:"", title:"", email:"", phone:"", group:"Silver", invoiced:0, received:0});
                setShowForm(!showForm);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusCircle size={16} /> {showForm ? "Cancel" : "Add Client"}
            </button>
          </div>
        )}
      </div>

      {activeTab === "overview" ? (
        <div className="flex flex-col gap-6 p-2">
          {/* Top Row: KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Clients</p>
                <h3 className="text-2xl font-bold text-gray-800">1,248</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-orange-50 text-orange-500">
                <Contact2 size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Contacts</p>
                <h3 className="text-2xl font-bold text-gray-800">3,812</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-500">
                <LogIn size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Logged in Today</p>
                <h3 className="text-2xl font-bold text-gray-800">142</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-teal-50 text-teal-500">
                <CalendarDays size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Logged in Last 7 Days</p>
                <h3 className="text-2xl font-bold text-gray-800">856</h3>
              </div>
            </div>
          </div>

          {/* Second Row: Invoice Progress Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Unpaid Invoices */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-yellow-500" />
                  <span className="font-semibold text-gray-800">Unpaid Invoices</span>
                </div>
                <span className="text-lg font-bold text-gray-800">$14,500</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: "12%" }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">12% of total clients</p>
            </div>

            {/* Partially Paid Invoices */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-blue-500" />
                  <span className="font-semibold text-gray-800">Partially Paid</span>
                </div>
                <span className="text-lg font-bold text-gray-800">$8,230</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                <div className="bg-blue-400 h-2 rounded-full" style={{ width: "24%" }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">24% of total clients</p>
            </div>

            {/* Overdue Invoices */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-red-500" />
                  <span className="font-semibold text-gray-800">Overdue Invoices</span>
                </div>
                <span className="text-lg font-bold text-gray-800">$21,800</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: "8%" }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">8% of total clients</p>
            </div>
          </div>

          {/* Third Row: Split-List Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Projects & Estimates */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h4 className="font-semibold text-gray-800">Projects & Estimates</h4>
              </div>
              <div className="p-4 flex-1">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {/* Projects Col */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FolderOpen size={16} className="text-indigo-400" />
                        <span className="text-sm font-medium">Open</span>
                      </div>
                      <span className="font-semibold text-gray-800">45</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <PlayCircle size={16} className="text-blue-400" />
                        <span className="text-sm font-medium">In Progress</span>
                      </div>
                      <span className="font-semibold text-gray-800">128</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircle2 size={16} className="text-green-400" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                      <span className="font-semibold text-gray-800">312</span>
                    </div>
                  </div>
                  
                  {/* Estimates Col */}
                  <div className="space-y-4 border-l border-gray-100 pl-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FileSpreadsheet size={16} className="text-purple-400" />
                        <span className="text-sm font-medium">Sent</span>
                      </div>
                      <span className="font-semibold text-gray-800">89</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircle2 size={16} className="text-green-400" />
                        <span className="text-sm font-medium">Accepted</span>
                      </div>
                      <span className="font-semibold text-gray-800">54</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <XCircle size={16} className="text-red-400" />
                        <span className="text-sm font-medium">Declined</span>
                      </div>
                      <span className="font-semibold text-gray-800">12</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tickets & Orders */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h4 className="font-semibold text-gray-800">Tickets & Orders</h4>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-center gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Ticket size={16} className="text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">Support Tickets</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">18% Affected</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-orange-400 h-2 rounded-full" style={{ width: "18%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={16} className="text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Recent Orders</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">32% Affected</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "32%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Proposals */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h4 className="font-semibold text-gray-800">Proposals</h4>
              </div>
              <div className="p-4 flex-1">
                <div className="space-y-4 mt-2">
                  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="p-1.5 bg-yellow-50 text-yellow-600 rounded-md">
                        <Coffee size={18} />
                      </div>
                      <span className="font-medium">Open Proposals</span>
                    </div>
                    <span className="font-bold text-gray-800">24</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="p-1.5 bg-green-50 text-green-600 rounded-md">
                        <CheckCircle2 size={18} />
                      </div>
                      <span className="font-medium">Accepted Proposals</span>
                    </div>
                    <span className="font-bold text-gray-800">186</span>
                  </div>

                  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="p-1.5 bg-red-50 text-red-600 rounded-md">
                        <XCircle size={18} />
                      </div>
                      <span className="font-medium">Rejected Proposals</span>
                    </div>
                    <span className="font-bold text-gray-800">31</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center flex-wrap gap-3">
              <div className="flex items-center border border-gray-300 rounded-md bg-gray-50 p-0.5">
                <button className="p-1 bg-white shadow-sm rounded text-gray-700"><ListIcon size={16} /></button>
                <button className="p-1 text-gray-500 hover:text-gray-700"><LayoutGrid size={16} /></button>
              </div>
              <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <Filter size={16} /> Filters
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <span>{filteredContacts.length} client(s)</span>
              <div className="h-4 w-px bg-gray-300 mx-2"></div>
              <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                <FileSpreadsheet size={18} />
              </button>
              <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                <Printer size={18} />
              </button>
            </div>
          </div>

          {/* FORM */}
          {showForm && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
              <input className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Name"
                value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
              <input className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Company"
                value={form.client} onChange={e => setForm({...form, client:e.target.value})} />
              <input className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Title"
                value={form.title} onChange={e => setForm({...form, title:e.target.value})} />
              <input className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Email"
                value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
              <input className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Phone"
                value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} />
              
              <select
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.group}
                onChange={e => setForm({...form, group:e.target.value})}
              >
                <option>Gold</option>
                <option>Silver</option>
                <option>VIP</option>
              </select>
              
              <input type="number" className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Total Invoiced"
                value={form.invoiced || ""}
                onChange={e => setForm({...form, invoiced:Number(e.target.value)})}
              />
              <input type="number" className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Payment Received"
                value={form.received || ""}
                onChange={e => setForm({...form, received:Number(e.target.value)})}
              />

              <button onClick={saveClient} className="md:col-span-4 bg-green-600 text-white font-medium p-2 rounded-md hover:bg-green-700 transition-colors">
                Save Client
              </button>
            </div>
          )}

          {/* TABLE */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Group</th>
                  <th className="px-4 py-3 font-medium">Invoiced</th>
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((c, index) => {
                    const due = c.invoiced - c.received;
                    return (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Image src={`https://i.pravatar.cc/150?u=${c.email || c.name}`} width={32} height={32} alt="" className="rounded-full shrink-0 bg-gray-200"/>
                            <span className="font-medium text-gray-800">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{c.client || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${groupColors[c.group] || groupColors["Silver"]}`}>
                            {c.group}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {c.invoiced?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || "₹0"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {c.received?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || "₹0"}
                        </td>
                        <td className={`px-4 py-3 font-medium ${due > 0 ? "text-red-500" : "text-green-500"}`}>
                          {due?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || "₹0"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => editClient(index)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                              <Pencil size={16}/>
                            </button>
                            <button onClick={() => setDeleteIndex(index)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* DELETE CONFIRMATION */}
          {deleteIndex !== null && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
              <span className="text-red-800 text-sm font-medium">Are you sure you want to delete this client?</span>
              <div className="flex gap-2">
                <button onClick={() => setDeleteIndex(null)} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700">Cancel</button>
                <button onClick={confirmDelete} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">Confirm Delete</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
