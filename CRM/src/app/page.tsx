"use client";

import { useEffect, useMemo, useState } from "react";
import { ListChecks, CalendarDays, Compass, FileText, StickyNote, ChevronDown, Check, PlusCircle } from "lucide-react";
import ClockWidget from "@/components/dashboard/ClockWidget";
import StatCard from "@/components/dashboard/StatCard";
import ProjectsOverview from "@/components/dashboard/ProjectsOverview";
import InvoiceOverview from "@/components/dashboard/InvoiceOverview";
import IncomeExpenses from "@/components/dashboard/IncomeExpenses";
import TaskOverview from "@/components/dashboard/TaskOverview";
import TeamMembers from "@/components/dashboard/TeamMembers";
import TicketStatus from "@/components/dashboard/TicketStatus";
import ProjectTimeline from "@/components/dashboard/ProjectTimeline";
import EventsList from "@/components/dashboard/EventsList";
import TodoWidget from "@/components/dashboard/TodoWidget";
import AnnouncementWidget from "@/components/dashboard/AnnouncementWidget";
import type { DashboardConfig, DashboardGraphType } from "@/lib/types";

type DashboardRange = "today" | "last_7_days" | "last_30_days" | "this_month" | "this_year";

type NewDashboardForm = {
  label: string;
  openTasks: number;
  events: number;
  due: string;
  graphType: DashboardGraphType;
  ticketColor: string;
};

function OpenProjectsWidget() {
  const rows = [
    { name: "Online Course Creation and Launch", pct: 0 },
    { name: "Social Media Influencer Collaboration", pct: 0 },
    { name: "Virtual Reality Experience Design", pct: 20 },
    { name: "Market Research and Analysis", pct: 27 },
    { name: "Content Writing and Blogging", pct: 29 },
  ];

  return (
    <div className="card p-4">
      <h3 className="section-title mb-3">
        <FileText size={15} className="text-[#93a1af]" /> Open Projects
      </h3>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.name}>
            <div className="mb-1 flex items-center justify-between text-sm text-[#607183]">
              <span>{row.name}</span>
              <span>{row.pct}%</span>
            </div>
            <div className="h-1.5 rounded bg-[#e7edf3]">
              <div className="h-1.5 rounded bg-[#273747]" style={{ width: `${row.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyTasksWidget() {
  return (
    <div className="card p-4">
      <h3 className="section-title mb-3">My Tasks</h3>
      <div className="h-24 rounded border border-[var(--border)] bg-[#fafbfd]" />
    </div>
  );
}

function StickyNoteWidget() {
  return (
    <div className="card p-0">
      <h3 className="section-title border-b border-[var(--border)] px-4 py-3">
        <StickyNote size={15} className="text-[#93a1af]" /> Sticky Note (Private)
      </h3>
      <div className="min-h-[110px] bg-[#f5efaa] px-4 py-3 text-sm text-[#46586c]">My quick notes here...</div>
    </div>
  );
}

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>("this_month");
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [openMenu, setOpenMenu] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [savingDashboard, setSavingDashboard] = useState(false);
  const [form, setForm] = useState<NewDashboardForm>({
    label: "",
    openTasks: 0,
    events: 0,
    due: "₹0.00",
    graphType: "donut",
    ticketColor: "#18b588",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/dashboards", { cache: "no-store" });
          if (!res.ok) return; // Ignore and don't parse JSON if backend fails
          let data = (await res.json()) as DashboardConfig[];
          // Simple migration for old data that might have '$'
          data = data.map((d) => ({
            ...d,
            due: typeof d.due === "string" ? d.due.replace("$", "₹") : d.due,
          }));
          setDashboards(data);
          setActiveId((prev) => prev || data[0]?.id || "");
        } catch (error) {
          console.error("Error fetching dashboards:", error);
        }
      })();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const current = useMemo(() => {
    if (dashboards.length === 0) {
      return {
        id: "temp",
        label: "Dashboard",
        openTasks: 0,
        events: 0,
        due: "₹0.00",
        graphType: "donut" as DashboardGraphType,
        ticketColor: "#18b588",
      };
    }
    return dashboards.find((item) => item.id === activeId) ?? dashboards[0];
  }, [dashboards, activeId]);

  async function createDashboard() {
    if (!form.label.trim()) return;
    setSavingDashboard(true);
    const res = await fetch("/api/dashboards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSavingDashboard(false);
    if (!res.ok) return;
    const created = (await res.json()) as DashboardConfig;
    setDashboards((prev) => [...prev, created]);
    setActiveId(created.id);
    setShowCreate(false);
    setForm({ label: "", openTasks: 0, events: 0, due: "₹0.00", graphType: "donut", ticketColor: "#18b588" });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative" onMouseEnter={() => setOpenMenu(true)} onMouseLeave={() => setOpenMenu(false)}>
          <button
            type="button"
            onClick={() => setOpenMenu((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[#334457]"
          >
            {current.label}
            <ChevronDown size={14} className={openMenu ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
          {openMenu ? (
            <div className="absolute z-20 mt-1 w-64 rounded border border-[var(--border)] bg-white p-1 shadow-sm">
              {dashboards.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveId(item.id);
                    setOpenMenu(false);
                  }}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm text-[#607183] hover:bg-[#f4f7fb]"
                >
                  {item.label}
                  {current.id === item.id ? <Check size={14} className="text-[#3f8cff]" /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {dashboards.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              className={`rounded px-3 py-1.5 text-sm ${
                current.id === item.id ? "bg-[#334457] text-white" : "border border-[var(--border)] bg-white text-[#607183]"
              }`}
            >
              {item.label.replace(" Dashboard", "")}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCreate((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded border border-[var(--border)] bg-white px-3 py-1.5 text-sm text-[#607183]"
          >
            <PlusCircle size={14} /> Add dashboard
          </button>
        </div>

        <div className="relative">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as DashboardRange)}
            className="appearance-none rounded border border-[var(--border)] bg-white py-2 pl-3 pr-8 text-sm text-[#607183]"
          >
            <option value="today">Today</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="this_year">This Year</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2 top-2.5 text-[#8fa0b1]" />
        </div>
      </div>

      {showCreate ? (
        <div className="grid grid-cols-1 gap-2 rounded border border-[var(--border)] p-3 md:grid-cols-7">
          <input
            className="rounded border border-[var(--border)] px-2 py-1.5 text-sm"
            placeholder="Dashboard name"
            value={form.label}
            onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
          />
          <input
            className="rounded border border-[var(--border)] px-2 py-1.5 text-sm"
            placeholder="Open tasks"
            type="number"
            value={form.openTasks}
            onChange={(e) => setForm((prev) => ({ ...prev, openTasks: Number(e.target.value) }))}
          />
          <input
            className="rounded border border-[var(--border)] px-2 py-1.5 text-sm"
            placeholder="Events"
            type="number"
            value={form.events}
            onChange={(e) => setForm((prev) => ({ ...prev, events: Number(e.target.value) }))}
          />
          <input
            className="rounded border border-[var(--border)] px-2 py-1.5 text-sm"
        placeholder="Due (e.g. ₹9,000.00)"
            value={form.due}
            onChange={(e) => setForm((prev) => ({ ...prev, due: e.target.value }))}
          />
          <select
            className="rounded border border-[var(--border)] px-2 py-1.5 text-sm"
            value={form.graphType}
            onChange={(e) => setForm((prev) => ({ ...prev, graphType: e.target.value as DashboardGraphType }))}
          >
            <option value="donut">Donut Graph</option>
            <option value="bar">Bar Graph</option>
            <option value="area">Area Graph</option>
          </select>
          <input
            className="rounded border border-[var(--border)] px-2 py-1.5 text-sm"
            placeholder="Ticket color #18b588"
            value={form.ticketColor}
            onChange={(e) => setForm((prev) => ({ ...prev, ticketColor: e.target.value }))}
          />
          <button
            type="button"
            onClick={() => void createDashboard()}
            disabled={savingDashboard}
            className="rounded bg-[#334457] px-3 py-1.5 text-sm text-white disabled:opacity-60"
          >
            {savingDashboard ? "Saving..." : "Create"}
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <ClockWidget />
        <StatCard icon={ListChecks} value={current.openTasks} label="My open tasks" iconBgClass="bg-[#3f9df5]" />
        <StatCard icon={CalendarDays} value={current.events} label="Events today" iconBgClass="bg-[#646d81]" />
        <StatCard icon={Compass} value={current.due} label="Due" iconBgClass="bg-[#ef3d7a]" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ProjectsOverview />
        <InvoiceOverview />
        <IncomeExpenses range={range} graphType={current.graphType} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <TaskOverview />
        <div className="space-y-4">
          <TeamMembers />
          <AnnouncementWidget />
        </div>
        <TicketStatus range={range} ticketColor={current.ticketColor} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_1.25fr_1.1fr]">
        <ProjectTimeline />
        <div className="space-y-4">
          <EventsList />
          <OpenProjectsWidget />
        </div>
        <TodoWidget />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <MyTasksWidget />
        <StickyNoteWidget />
      </div>
    </div>
  );
}
