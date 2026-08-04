"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Plus, MoreVertical, Clock } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { Tabs } from "@/components/ui/Tabs"

type Note = {
  id: string
  title: string
  time: string
  excerpt: string
  category: string
  color: "pink" | "orange" | "blue" | "green" | "yellow" | "purple"
  isImportant?: boolean
}

const MOCK_NOTES: Note[] = [
  { id: "1", title: "Reconnecting with Old Friends", time: "Today at 07:52:26 am", excerpt: "Today I made time to catch up with some old friends, something I hadn't done in quite a while. The conversations were refreshing and reminded me of how important it is to maintain relationships beyond work and everyday responsibilities. These...", category: "Daily Reflections", color: "pink" },
  { id: "2", title: "Staying Calm Under Pressure", time: "Today at 07:51:46 am", excerpt: "Work was intense today with a few unexpected technical challenges that caught me off guard. Instead of panicking, I took a step back, assessed the situation, and tackled each problem methodically. By the end of the day, I had resolved...", category: "Daily Reflections", color: "orange" },
  { id: "3", title: "Time Management Lessons", time: "Today at 07:50:51 am", excerpt: "Today was a big win as I finally wrapped up the project I had been working on for the last several weeks. The sense of accomplishment was really satisfying, especially since there were times I doubted whether I could finish on time. Through...", category: "Daily Reflections", color: "blue" },
  { id: "4", title: "Enhancing Creative Problem-Solving", time: "Today at 06:11:26 am", excerpt: "Creative problem-solving is an area I want to focus on to improve my critical thinking. I've read that techniques like mind mapping and lateral thinking...", category: "Learning & Development", color: "green", isImportant: true },
  { id: "5", title: "Developing Leadership Qualities", time: "Today at 06:10:48 am", excerpt: "I've been thinking about how I can grow as a leader, especially in managing teams. I'm planning to read books on leadership, like Leaders Eat Last by Simon Sinek, and take an online leadership course. I also want to practice by taking on more leadership role...", category: "Learning & Development", color: "green" },
  { id: "6", title: "Learning a New Language", time: "Today at 06:10:15 am", excerpt: "I've been interested in learning Spanish for a while, and I'm committing to finally doing it. I'll set aside 30 minutes each day for practice using apps like Duolingo, and I'll supplement that with podcasts and language exchange with native speakers. Learning...", category: "Ideas & Inspiration", color: "yellow" },
  { id: "7", title: "Improving Public Speaking Skills", time: "Today at 06:09:15 am", excerpt: "I've realized the importance of being an effective communicator, especially in professional settings. I plan to enroll in a public speaking course or join a...", category: "Learning & Development", color: "blue", isImportant: true },
  { id: "8", title: "Mental Health Journaling Tool", time: "Today at 06:08:08 am", excerpt: "A mental health journaling app that guides users through writing prompts to improve their well-being could be helpful. The app would include features like mood tracking, gratitude logs, and cognitive behavioral therapy (CBT)-based prompts. The goa...", category: "Learning & Development", color: "purple" },
]

const colorMap = {
  pink: "bg-[#fdf4f6] border-[#fce4ea] hover:shadow-[#fce4ea]/50 dark:bg-pink-950/20 dark:border-pink-900/30",
  orange: "bg-[#fff7ed] border-[#ffedd5] hover:shadow-[#ffedd5]/50 dark:bg-orange-950/20 dark:border-orange-900/30",
  blue: "bg-[#f0f9ff] border-[#e0f2fe] hover:shadow-[#e0f2fe]/50 dark:bg-sky-950/20 dark:border-sky-900/30",
  green: "bg-[#f0fdf4] border-[#dcfce7] hover:shadow-[#dcfce7]/50 dark:bg-green-950/20 dark:border-green-900/30",
  yellow: "bg-[#fefce8] border-[#fef9c3] hover:shadow-[#fef9c3]/50 dark:bg-yellow-950/20 dark:border-yellow-900/30",
  purple: "bg-[#faf5ff] border-[#f3e8ff] hover:shadow-[#f3e8ff]/50 dark:bg-purple-950/20 dark:border-purple-900/30",
}

export default function NotesMain() {
  const [activeTab, setActiveTab] = React.useState("grid")

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes (Private)</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">Manage labels</Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />}>Add note</Button>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-soft rounded-xl p-6 min-h-[500px]">
        <Tabs 
          tabs={[{ id: 'list', label: 'List' }, { id: 'grid', label: 'Grid' }, { id: 'categories', label: 'Categories' }]} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
        
        {activeTab === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {MOCK_NOTES.map((note) => (
              <motion.div
                key={note.id}
                whileHover={{ y: -4, scale: 1.01 }}
                className={`p-5 rounded-2xl border transition-all duration-300 shadow-sm cursor-pointer flex flex-col min-h-[220px] ${colorMap[note.color]}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-2 leading-tight">{note.title}</h3>
                  <button className="text-muted-foreground hover:text-foreground -mt-1"><MoreVertical size={16} /></button>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                  <Clock size={12} />
                  <span>{note.time}</span>
                </div>

                <p className="text-sm text-foreground/80 line-clamp-5 flex-1 mb-4 leading-relaxed">
                  {note.excerpt}
                </p>

                <div className="flex flex-wrap gap-2 mt-auto">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <span className="w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center text-[8px]">🎯</span>
                    {note.category}
                  </span>
                  {note.isImportant && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shadow-sm ml-auto">
                      Important
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab !== 'grid' && (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium text-foreground capitalize">{activeTab} View Placeholder</h3>
          </div>
        )}
      </div>
    </motion.div>
  )
}


