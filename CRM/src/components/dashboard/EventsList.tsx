import { CalendarDays, Lock, LockOpen } from "lucide-react";

const events = [
  { title: "Women in Leadership Forum", time: "Sat, March 14, 12:18:00 pm - 01:08:00 pm", locked: false },
  { title: "Customer Appreciation Day", time: "Sun, March 15, 06:59:00 am - 08:09:00 am", locked: false },
  { title: "Sales Training Workshop", time: "Sun, March 15, 06:33:00 am - 07:53:00 am", locked: false },
  { title: "Health and Wellness Fair", time: "Tue, March 17, 08:46:00 pm - 10:16:00 pm", locked: true },
];

export default function EventsList() {
  return (
    <div className="card p-4">
      <h3 className="section-title mb-3">
        <CalendarDays size={15} className="text-[#93a1af]" /> Events
      </h3>
      <div className="space-y-3 border-b border-[var(--border)] pb-3">
        {events.map((event) => (
          <div key={event.title} className="text-sm">
            <p className="flex items-center gap-1 text-[#557083]">
              {event.locked ? <Lock size={12} /> : <LockOpen size={12} />} {event.title}
            </p>
            <p className="text-[#7e8ea0]">{event.time}</p>
          </div>
        ))}
      </div>
      <button className="mt-3 w-full rounded border border-[var(--border)] py-2 text-sm text-[#617284]">View on calendar</button>
    </div>
  );
}
