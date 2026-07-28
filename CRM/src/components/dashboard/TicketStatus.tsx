import { Ticket } from "lucide-react";

type DashboardRange = "today" | "last_7_days" | "last_30_days" | "this_month" | "this_year";

type TicketView = {
  newCount: number;
  openCount: number;
  closedCount: number;
  categories: [number, number, number];
  bars: number[];
};

const VIEWS: Record<DashboardRange, TicketView> = {
  today: { newCount: 4, openCount: 11, closedCount: 18, categories: [3, 6, 5], bars: [8, 12, 9, 15, 7, 10, 13, 11, 9, 14, 8, 10, 12, 9, 11, 13] },
  last_7_days: { newCount: 12, openCount: 25, closedCount: 38, categories: [8, 14, 11], bars: [18, 25, 22, 31, 24, 19, 28, 33, 29, 24, 31, 27, 23, 26, 30, 35] },
  last_30_days: { newCount: 21, openCount: 39, closedCount: 69, categories: [16, 25, 19], bars: [20, 45, 30, 25, 40, 37, 29, 43, 34, 47, 22, 40, 33, 31, 45, 26] },
  this_month: { newCount: 26, openCount: 42, closedCount: 74, categories: [18, 27, 21], bars: [24, 38, 36, 29, 41, 45, 33, 39, 43, 48, 37, 46, 34, 40, 47, 44] },
  this_year: { newCount: 114, openCount: 229, closedCount: 501, categories: [89, 133, 121], bars: [28, 34, 39, 44, 41, 48, 45, 53, 49, 55, 52, 60, 58, 61, 63, 67] },
};

export default function TicketStatus({
  range = "this_month",
  ticketColor = "#18b588",
}: {
  range?: DashboardRange;
  ticketColor?: string;
}) {
  const view = VIEWS[range];

  const left = [
    { label: "New", value: view.newCount, color: "#e8ac24" },
    { label: "Open", value: view.openCount, color: "#ef4d6d" },
    { label: "Closed", value: view.closedCount, color: "#4f74e6" },
  ];

  const right = [
    { label: "General Support", value: view.categories[0] },
    { label: "Bug Reports", value: view.categories[1] },
    { label: "Sales Inquiry", value: view.categories[2] },
  ];

  return (
    <div className="card p-4">
      <h3 className="section-title mb-4">
        <Ticket size={15} className="text-[#93a1af]" /> Ticket Status
      </h3>

      <div className="grid grid-cols-2 gap-2 border-b border-[var(--border)] pb-4">
        <div className="space-y-2 pr-3">
          {left.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-[#617284]">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                {row.label}
              </span>
              <span className="font-semibold text-[#334457]">{row.value}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 border-l border-[var(--border)] pl-3">
          {right.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm text-[#617284]">
              <span>{row.label}</span>
              <span className="font-semibold text-[#ef4d6d]">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-sm text-[#7f8d9c]">Ticket trend</p>
      <div className="mt-2 flex h-16 items-end gap-2">
        {view.bars.map((h, idx) => (
          <span key={idx} className="w-2 rounded-t" style={{ height: `${h}px`, backgroundColor: ticketColor }} />
        ))}
      </div>
    </div>
  );
}
