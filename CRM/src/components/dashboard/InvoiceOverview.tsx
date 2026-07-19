import { FileText } from "lucide-react";

const rows = [
  { label: "Overdue", count: 5, amount: "₹2,648.50", color: "#ef4d6d" },
  { label: "Not paid", count: 5, amount: "₹3,256.00", color: "#f0b33c" },
  { label: "Partially paid", count: 9, amount: "₹10,720.00", color: "#5f8df6" },
  { label: "Fully paid", count: 11, amount: "₹12,470.00", color: "#4d6de3" },
  { label: "Draft", count: 1, amount: "₹120.00", color: "#8f9dad" },
];

export default function InvoiceOverview() {
  return (
    <div className="card p-4">
      <h3 className="section-title mb-4">
        <FileText size={15} className="text-[#93a1af]" /> Invoice Overview
      </h3>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[24px_1fr_64px_120px] items-center gap-3 text-sm">
            <span style={{ color: row.color }} className="font-semibold">
              {row.count}
            </span>
            <span className="text-[#607183]">{row.label}</span>
            <div className="h-1 rounded bg-[#e8eef5]">
              <div className="h-1 rounded" style={{ width: "35%", backgroundColor: row.color }} />
            </div>
            <span className="text-right text-[#607183]">{row.amount}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 border-t border-[var(--border)] pt-4 text-sm">
        <div>
          <p className="text-[#7f8d9c]">Total invoiced</p>
          <p className="text-2xl font-semibold text-[#3a4a5d]">₹26,446.00</p>
          <p className="mt-2 text-[#7f8d9c]">Due</p>
          <p className="text-2xl font-semibold text-[#3a4a5d]">₹8,616.00</p>
        </div>
        <div className="text-right text-[#7f8d9c]">
          <p>Last 12 months</p>
          <svg className="mt-3 inline-block" width="160" height="56" viewBox="0 0 160 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 55H118C130 55 128 14 140 8C148 4 152 6 160 16" stroke="#5f8df6" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
}
