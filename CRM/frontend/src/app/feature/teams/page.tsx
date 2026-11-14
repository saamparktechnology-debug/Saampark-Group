"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, UserPlus, Search, Building2, GitBranch, Briefcase, 
  Shield, CheckCircle2, Phone, Mail, Plus, X, ArrowRight 
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import Link from "next/link"

export interface TeamSquad {
  id: string
  name: string
  lead: string
  department: string
  branchName: string
  membersCount: number
  activeProjects: number
  description: string
  tags: string[]
}

const DEFAULT_TEAMS: TeamSquad[] = [
  {
    id: "team_1",
    name: "Enterprise Solutions Core",
    lead: "Supriya (Super Admin)",
    department: "Engineering",
    branchName: "Kolkata HQ",
    membersCount: 12,
    activeProjects: 8,
    description: "Architects and full-stack engineers developing high-scale Next.js and cloud solutions.",
    tags: ["Full-Stack", "Cloud", "DevOps"]
  },
  {
    id: "team_2",
    name: "UI/UX & Product Design Guild",
    lead: "Ramesh Babu",
    department: "Product Design",
    branchName: "Bangalore Digital Branch",
    membersCount: 6,
    activeProjects: 5,
    description: "Brand identity, interactive Figma prototypes, and cohesive enterprise design tokens.",
    tags: ["Figma", "Design Systems", "Prototyping"]
  },
  {
    id: "team_3",
    name: "Commercial & Business Development",
    lead: "Rajesh Kumar",
    department: "Sales & Client Success",
    branchName: "Mumbai Financial Branch",
    membersCount: 8,
    activeProjects: 14,
    description: "Enterprise proposals, quotations, client relationships, and sales pipeline management.",
    tags: ["CRM", "Client Success", "Tenders"]
  },
  {
    id: "team_4",
    name: "AI & Cognitive Automation Lab",
    lead: "Dr. Ananya Sen",
    department: "Research & AI",
    branchName: "Kolkata HQ",
    membersCount: 5,
    activeProjects: 4,
    description: "Generative AI pipelines, NLP workflow engines, and predictive analytics models.",
    tags: ["GenAI", "Python", "LLMs"]
  }
]

export default function TeamsPage() {
  const { branches, companies, activeCompanyId } = useAuthStore()
  const [teams, setTeams] = React.useState<TeamSquad[]>(DEFAULT_TEAMS)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [deptFilter, setDeptFilter] = React.useState("all")
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const [form, setForm] = React.useState({
    name: "",
    lead: "",
    department: "Engineering",
    branchName: branches[0]?.name || "Kolkata HQ",
    membersCount: 4,
    activeProjects: 2,
    description: "",
    tags: "Engineering, Agile"
  })

  const filteredTeams = teams.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lead.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department.toLowerCase().includes(searchQuery.toLowerCase())
    if (deptFilter !== "all" && t.department !== deptFilter) return false
    return matchesSearch
  })

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault()
    const newTeam: TeamSquad = {
      id: `team_${Date.now()}`,
      name: form.name,
      lead: form.lead,
      department: form.department,
      branchName: form.branchName,
      membersCount: Number(form.membersCount) || 1,
      activeProjects: Number(form.activeProjects) || 0,
      description: form.description,
      tags: form.tags.split(",").map(s => s.trim()).filter(Boolean)
    }
    setTeams(prev => [newTeam, ...prev])
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
              <Users size={22} />
            </div>
            <span>Organization Teams &amp; Squads</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Departmental squads, team leaders, cross-functional units, and operational branch assignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/feature/team/members"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors shadow-2xs"
          >
            <UserPlus size={14} className="text-blue-600" />
            <span>View All Members</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Squad</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search teams by squad name, lead, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["all", "Engineering", "Product Design", "Sales & Client Success", "Research & AI"].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDeptFilter(d)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer shrink-0 ${
                deptFilter === d
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {team.department}
                  </span>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-2">{team.name}</h3>
                </div>
                <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-500">
                  <Users size={18} />
                </div>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                {team.description}
              </p>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">Squad Lead:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{team.lead}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">Assigned Branch:</span>
                  <span className="font-medium text-blue-700 dark:text-blue-400">{team.branchName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">Active Headcount:</span>
                  <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{team.membersCount} Members</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {team.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {team.activeProjects} active projects
              </span>
              <Link
                href="/feature/team/members"
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
              >
                <span>Members</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add Team Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-xs">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  <Users size={16} className="text-blue-600" />
                  <span>Configure Organization Squad</span>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg cursor-pointer"><X size={16} /></button>
              </div>

              <form onSubmit={handleAddTeam} className="p-6 space-y-4">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Squad Name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-bold" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Department</label>
                    <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                      <option value="Engineering">Engineering</option>
                      <option value="Product Design">Product Design</option>
                      <option value="Sales & Client Success">Sales & Client Success</option>
                      <option value="Research & AI">Research & AI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Assigned Branch</label>
                    <select value={form.branchName} onChange={e => setForm({ ...form, branchName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                      {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Squad Lead Name *</label>
                  <input type="text" required value={form.lead} onChange={e => setForm({ ...form, lead: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800" />
                </div>

                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Description & Scope</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800" />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-100 cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">Save Squad</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
