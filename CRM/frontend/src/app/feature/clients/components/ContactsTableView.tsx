"use client"

import * as React from "react"
import { Search, FileSpreadsheet, Printer, LayoutGrid, ChevronDown, X, User, ChevronLeft, ChevronRight } from "lucide-react"
import { ContactItem } from "../types"

interface ContactsTableViewProps {
  contacts: ContactItem[]
  onDeleteContact: (id: string) => void
}

export function ContactsTableView({
  contacts,
  onDeleteContact,
}: ContactsTableViewProps) {
  const [searchText, setSearchText] = React.useState("")

  const filteredContacts = React.useMemo(() => {
    return contacts.filter((c) => {
      if (!searchText.trim()) return true
      const q = searchText.toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        c.clientName.toLowerCase().includes(q) ||
        c.jobTitle.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
      )
    })
  }, [contacts, searchText])

  const handleDelete = (id: string) => {
    onDeleteContact(id)
  }

  return (
    <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
      {/* Toolbar Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sidebar icon */}
          <button
            type="button"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          >
            <LayoutGrid size={16} />
          </button>

          {/* Quick Filters Dropdown */}
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 flex items-center gap-2 shadow-2xs hover:bg-slate-200"
          >
            <span>- Quick filters -</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" /> Excel
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Printer size={14} className="text-slate-500" /> Print
          </button>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search"
              className="pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            />
            <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="py-3 px-3">Name</th>
              <th className="py-3 px-3">↑ Client name</th>
              <th className="py-3 px-3">Job Title</th>
              <th className="py-3 px-3">Email</th>
              <th className="py-3 px-3">Phone</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                  No contacts found.
                </td>
              </tr>
            ) : (
              filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-[10px] text-slate-500 shrink-0">
                        {contact.avatarSeed ? (
                          <img
                            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${contact.avatarSeed}`}
                            alt={contact.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={13} />
                        )}
                      </div>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                        {contact.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">{contact.clientName}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{contact.jobTitle}</td>
                  <td className="py-3 px-3 text-blue-500 hover:underline cursor-pointer">{contact.email}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{contact.phone}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(contact.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete"
                    >
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <select className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>1-10 / 50</span>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50">
            <ChevronLeft size={14} />
          </button>
          {[1, 2, 3, 4, 5].map((p) => (
            <button
              key={p}
              type="button"
              className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                p === 1
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
          <button type="button" className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
