"use client";

import { Clock3, LogIn } from "lucide-react";

export default function ClockWidget() {
  return (
    <div className="card flex items-center justify-between p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded bg-[#ef3d7a]">
        <Clock3 size={18} className="text-white" />
      </div>
      <div className="text-right">
        <button className="inline-flex items-center gap-1 rounded border border-[#f2d7df] bg-white px-2 py-1 text-xs text-[#ef3d7a]">
          <LogIn size={12} /> Clock In
        </button>
        <p className="mt-2 text-sm text-[#778696]">You are currently clocked out</p>
      </div>
    </div>
  );
}
