import { UsersRound } from "lucide-react";

export default function TeamMembers() {
  return (
    <div className="card p-4">
      <h3 className="section-title mb-4">
        <UsersRound size={15} className="text-[#93a1af]" /> Team Members Overview
      </h3>

      <div className="mb-3 grid grid-cols-2 border-b border-[var(--border)] pb-3 text-center">
        <div>
          <p className="text-4xl font-semibold text-[#334457]">5</p>
          <p className="text-sm text-[#7f8d9c]">Team members</p>
        </div>
        <div>
          <p className="text-4xl font-semibold text-[#f0b33c]">0</p>
          <p className="text-sm text-[#7f8d9c]">On leave today</p>
        </div>
      </div>

      <div className="grid grid-cols-2 text-center">
        <div>
          <p className="text-4xl font-semibold text-[#ef4d6d]">2</p>
          <div className="mx-auto mt-2 h-1 w-20 rounded bg-[#ef4d6d]" />
          <p className="mt-2 text-sm text-[#7f8d9c]">Members Clocked In</p>
        </div>
        <div>
          <p className="text-4xl font-semibold text-[#6684ff]">3</p>
          <div className="mx-auto mt-2 h-1 w-20 rounded bg-[#2f3c4d]" />
          <p className="mt-2 text-sm text-[#7f8d9c]">Members Clocked Out</p>
        </div>
      </div>
    </div>
  );
}
