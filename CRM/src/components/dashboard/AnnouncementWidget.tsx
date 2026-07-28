import { Mic } from "lucide-react";

export default function AnnouncementWidget() {
  return (
    <div className="card p-4">
      <h3 className="section-title mb-2">
        <Mic size={15} className="text-[#93a1af]" /> Last announcement
      </h3>
      <p className="text-sm text-[#627486]">Tomorrow is holiday!</p>
    </div>
  );
}
