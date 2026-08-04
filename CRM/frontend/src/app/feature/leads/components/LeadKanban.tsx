import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RowActions } from "@/components/ui/RowActions"
import { Lead } from "../types"
import { statusColors } from "../services/leadService"

interface LeadKanbanProps {
  leads: Lead[]
  onDelete: (id: string) => void
}

export const LeadKanban: React.FC<LeadKanbanProps> = ({ leads, onDelete }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 pt-4 overflow-x-auto pb-4">
      {Object.keys(statusColors).map(status => {
        const columnLeads = leads.filter(l => l.status === status)
        return (
          <div key={status} className="bg-surface-hover rounded-xl p-3 min-w-[200px] flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-4">
              <span className={`px-2.5 py-1 rounded text-xs font-semibold border shadow-sm ${statusColors[status]}`}>{status}</span>
              <span className="text-xs font-medium text-muted-foreground bg-surface px-2 py-0.5 rounded-full border border-border">{columnLeads.length}</span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-1">
              <AnimatePresence>
                {columnLeads.map(l => (
                  <motion.div 
                    key={l.id} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-surface border border-border rounded-lg p-3 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-semibold text-foreground/90 leading-tight pr-6">{l.name}</p>
                      
                      {/* Kanban Card Action Menu */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <RowActions 
                          onEdit={() => alert(`Editing ${l.name}`)} 
                          onDelete={() => onDelete(l.id)} 
                        />
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3">{l.primaryContact}</p>
                    
                    <div className="flex items-center justify-between mt-auto border-t border-border/50 pt-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary border border-primary/20" title={l.owner}>
                          {l.owner.charAt(0)}
                        </div>
                        <span className="text-xs font-medium">{l.value}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {columnLeads.length === 0 && (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">Drop here</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
