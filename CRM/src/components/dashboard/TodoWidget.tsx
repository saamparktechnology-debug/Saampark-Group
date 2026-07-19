"use client";

import { Save, Search } from "lucide-react";

const todos = [
  "Set roles and permissions for team members",
  "Setup notifications for tasks",
  "Re-arrange the widgets of my dashboard",
  "Setup IP restriction for time logs",
  "Discuss with team members",
];

export default function TodoWidget() {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="section-title">To do (Private)</h3>
        <span className="text-sm text-[#7f8d9c]">Sortable</span>
      </div>

      <div className="mb-3 flex gap-2">
        <input className="w-full rounded border border-[var(--border)] px-3 py-2 text-sm" placeholder="Add a to do..." />
        <button className="inline-flex items-center gap-1 rounded bg-[#1e2b3b] px-3 py-2 text-sm text-white">
          <Save size={14} /> Save
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-2">
        <div className="flex gap-2">
          <button className="rounded border border-[var(--border)] px-3 py-1 text-sm text-[#607183]">To do</button>
          <button className="rounded border border-[var(--border)] px-3 py-1 text-sm text-[#607183]">Done</button>
        </div>
        <div className="flex items-center gap-1 text-sm text-[#7f8d9c]">
          Search <Search size={14} />
        </div>
      </div>

      <div className="space-y-2">
        {todos.map((todo) => (
          <div key={todo} className="flex items-center gap-2 text-sm text-[#617284]">
            <input type="checkbox" className="h-4 w-4" />
            <span className="flex-1">{todo}</span>
            <button className="text-[#a1afbe]">...</button>
          </div>
        ))}
      </div>
    </div>
  );
}
