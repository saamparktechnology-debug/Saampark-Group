import { LayoutGrid, Bell } from "lucide-react";

const items = [
  { label: "Open", value: 24, color: "#17b892" },
  { label: "Completed", value: 6, color: "#ef4d6d" },
  { label: "Hold", value: 0, color: "#f4b63a" },
];

export default function ProjectsOverview() {
  return (
    <div className="card p-4">
      <h3 className="section-title mb-4">
        <LayoutGrid size={15} className="text-[#93a1af]" /> Projects Overview
      </h3>

      <div className="mb-5 grid grid-cols-3 gap-2 text-center">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-3xl font-semibold" style={{ color: item.color }}>
              {item.value}
            </p>
            <p className="text-sm text-[#7f8d9c]">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 rounded-full border border-[#31b08f] bg-[#f7fcfb] p-0.5">
        <div className="h-5 w-[31%] rounded-full bg-[#9edcc9] text-center text-sm leading-5 text-[#5f7689]">Progression 31%</div>
      </div>

      <div className="grid grid-cols-[1fr_2fr] items-center gap-4 border-t border-[var(--border)] pt-4">
        <div>
          <p className="text-3xl font-semibold text-[#ef4d6d]">0</p>
          <p className="text-sm text-[#7f8d9c]">Reminder Today</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#6f8092]">
          <Bell size={15} className="text-[#ef4d6d]" />
          <div>
            <p className="text-[15px]">Next reminder</p>
            <p>28-02-2026 - Renew mydomain.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
