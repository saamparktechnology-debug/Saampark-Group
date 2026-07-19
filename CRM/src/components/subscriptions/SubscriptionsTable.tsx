"use client";

import { Search, PlusCircle, Tag, Filter } from "lucide-react";

type Subscription = {
  id: string;
  title: string;
  type: string;
  client: string;
  firstBill: string;
  nextBill: string;
  repeat: string;
  cycles: string;
  status: string;
  amount: string;
};

const subscriptions: Subscription[] = [
  { id: "SUBSCRIPTION #2", title: "Monthly subscription of 10 GB Hosting", type: "App", client: "Demo Client", firstBill: "18-02-2026", nextBill: "19-03-2026", repeat: "1 Month(s)", cycles: "0/8", status: "Active", amount: "$100.00" },
  { id: "SUBSCRIPTION #1", title: "Yearly subscription of example.com domain", type: "App", client: "Demo Client", firstBill: "18-02-2026", nextBill: "19-03-2026", repeat: "1 Year(s)", cycles: "0/8", status: "Active", amount: "$11.00" },
];

export default function SubscriptionsTable() {
  return (
    <div className="card p-3">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="section-title text-[28px]">Subscriptions</h1>
        <div className="flex gap-2 text-sm">
          <button className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-3 py-1.5 text-[#607183]"><Tag size={14} />Manage labels</button>
          <button className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-3 py-1.5 text-[#607183]"><PlusCircle size={14} />Add subscription</button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between rounded border border-[var(--border)] p-2 text-sm text-[#607183]">
        <div className="flex items-center gap-2">
          <button className="rounded border border-[var(--border)] p-1"><Filter size={14} /></button>
          <button className="rounded border border-[var(--border)] px-3 py-1">+ Add new filter</button>
        </div>
        <div className="flex items-center gap-3">
          <button>Excel</button>
          <button>Print</button>
          <div className="relative">
            <Search size={14} className="absolute left-2 top-2 text-[#93a2b4]" />
            <input className="rounded border border-[var(--border)] py-1.5 pl-7 pr-3" placeholder="Search" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-t border-[var(--border)]">
          <thead>
            <tr>
              <th className="table-head py-2 text-left">Subscription ID</th>
              <th className="table-head py-2 text-left">Title</th>
              <th className="table-head py-2 text-left">Type</th>
              <th className="table-head py-2 text-left">Client</th>
              <th className="table-head py-2 text-left">First billing date</th>
              <th className="table-head py-2 text-left">Next billing date</th>
              <th className="table-head py-2 text-left">Repeat every</th>
              <th className="table-head py-2 text-left">Cycles</th>
              <th className="table-head py-2 text-left">Status</th>
              <th className="table-head py-2 text-left">Amount</th>
              <th className="table-head py-2" />
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="border-t border-[var(--border)]">
                <td className="table-cell py-2">{sub.id}</td>
                <td className="table-cell py-2 text-[#7d74d8]">{sub.title}</td>
                <td className="table-cell py-2"><span className="rounded bg-[#f0b31f] px-2 py-0.5 text-[11px] text-white">{sub.type}</span></td>
                <td className="table-cell py-2">{sub.client}</td>
                <td className="table-cell py-2">{sub.firstBill}</td>
                <td className="table-cell py-2">{sub.nextBill}</td>
                <td className="table-cell py-2">{sub.repeat}</td>
                <td className="table-cell py-2">{sub.cycles}</td>
                <td className="table-cell py-2"><span className="rounded bg-[#5a667d] px-2 py-0.5 text-[11px] text-white">{sub.status}</span></td>
                <td className="table-cell py-2">{sub.amount}</td>
                <td className="py-2 text-right text-[#9ba9b8]">o ...</td>
              </tr>
            ))}
            <tr className="border-t border-[var(--border)]">
              <td colSpan={9} className="py-2 text-right text-sm text-[#5e7083]">Total</td>
              <td className="py-2 text-sm font-semibold text-[#5e7083]">₹111.00</td>
              <td className="py-2" />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-[#718194]">
        <div className="flex items-center gap-2">
          <select className="rounded border border-[var(--border)] px-2 py-1"><option>10</option></select>
          <span>1-2 / 2</span>
        </div>
        <div className="flex items-center gap-3">
          <button>{"<"}</button><button className="rounded border border-[var(--border)] px-2">1</button><button>{">"}</button>
        </div>
      </div>
    </div>
  );
}
