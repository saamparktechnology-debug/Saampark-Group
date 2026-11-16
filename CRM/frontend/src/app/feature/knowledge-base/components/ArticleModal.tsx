"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { KnowledgeArticle, KnowledgeArticleFormValues } from "../types"

interface ArticleModalProps {
  isOpen: boolean
  editingItem: KnowledgeArticle | null
  values: KnowledgeArticleFormValues
  onClose: () => void
  onChange: <K extends keyof KnowledgeArticleFormValues>(key: K, value: KnowledgeArticleFormValues[K]) => void
  onSubmit: (e: React.FormEvent) => void
}

export function ArticleModal({
  isOpen,
  editingItem,
  values,
  onClose,
  onChange,
  onSubmit,
}: ArticleModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm">{editingItem ? "Edit" : "Add"} Article</h3>
              <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={values.title}
                  onChange={(e) => onChange("title", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Category</label>
                  <select
                    value={values.category}
                    onChange={(e) => onChange("category", e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"
                  >
                    <option>General</option>
                    <option>Getting Started</option>
                    <option>FAQ</option>
                    <option>Tutorials</option>
                    <option>API Docs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Status</label>
                  <select
                    value={values.status}
                    onChange={(e) => onChange("status", e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden"
                  >
                    <option>Published</option>
                    <option>Draft</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-semibold mb-1">Content</label>
                <textarea
                  rows={8}
                  value={values.content}
                  onChange={(e) => onChange("content", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-hidden font-mono text-[11px]"
                  placeholder="Write your article content here..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {editingItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
