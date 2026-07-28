import { ListChecks } from "lucide-react";

const rows = [
  { label: "To do", value: 78, color: "#f0b33c" },
  { label: "In progress", value: 61, color: "#3f8cff" },
  { label: "Review", value: 68, color: "#a53ac8" },
  { label: "Done", value: 169, color: "#12b89a" },
  { label: "Expired", value: 134, color: "#ef4d6d" },
];

export default function TaskOverview() {
  return (
    <div className="card p-4">
      <h3 className="section-title mb-4">
        <ListChecks size={15} className="text-[#93a1af]" /> All Tasks Overview
      </h3>

      <div className="grid grid-cols-[160px_1fr] gap-3">
        <div className="flex items-center justify-center">
          <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="75" cy="75" r="45" stroke="#eceff4" strokeWidth="8" />
            <circle cx="75" cy="75" r="45" stroke="#12b89a" strokeWidth="8" strokeDasharray="110 80" transform="rotate(-90 75 75)" />
            <circle cx="75" cy="75" r="45" stroke="#f0b33c" strokeWidth="8" strokeDasharray="30 160" transform="rotate(30 75 75)" />
            <circle cx="75" cy="75" r="45" stroke="#a53ac8" strokeWidth="8" strokeDasharray="34 156" transform="rotate(80 75 75)" />
            <circle cx="75" cy="75" r="45" stroke="#3f8cff" strokeWidth="8" strokeDasharray="32 158" transform="rotate(120 75 75)" />
          </svg>
        </div>

        <div className="space-y-2 self-center">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-[#617284]">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                {row.label}
              </div>
              <span style={{ color: row.color }} className="font-semibold">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
