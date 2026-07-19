import { Clock3 } from "lucide-react";

const items = [
  {
    user: "Sara Ann",
    time: "Today at 01:12:46 pm",
    task: "Task: #3425 - Implement product zoom and gallery",
    status: "Status: Review -> Done",
    project: "Project: Product Photography and Cataloging",
  },
  {
    user: "Sara Ann",
    time: "Today at 01:12:36 pm",
    task: "Task: #3419 - Create product categories and tags",
    status: "Status: To do -> In progress",
    project: "Project: Product Photography and Cataloging",
  },
  {
    user: "smapark",
    time: "Today at 01:11:47 pm",
    task: "Task: #3281 - Create database schema for app",
    status: "Status: Review -> Done",
    project: "Project: Mobile App Development",
  },
];

export default function ProjectTimeline() {
  return (
    <div className="card p-4">
      <h3 className="section-title mb-3">
        <Clock3 size={15} className="text-[#93a1af]" /> Project Timeline
      </h3>
      <div className="max-h-[540px] space-y-4 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.task} className="border-b border-[var(--border)] pb-3 last:border-0">
            <p className="text-sm text-[#516276]"><span className="font-semibold">{item.user}</span> <span className="text-[#96a5b4]">{item.time}</span></p>
            <p className="mt-1 text-sm text-[#5b6c7f]">{item.task}</p>
            <p className="text-sm text-[#5b6c7f]">{item.status}</p>
            <p className="text-sm text-[#5b6c7f]">{item.project}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

