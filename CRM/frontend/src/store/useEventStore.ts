import { create } from 'zustand'

export type EventCategory = 'Meeting' | 'Holiday' | 'Deadline' | 'Training' | 'Default'

export interface AppEvent {
  id: string
  title: string
  start: string
  end?: string
  allDay?: boolean
  description?: string
  location?: string
  category: EventCategory
  className?: string
}

interface EventState {
  events: AppEvent[]
  activeFilters: EventCategory[]
  searchQuery: string
  isAddModalOpen: boolean
  selectedDate: Date | null
  selectedEvent: AppEvent | null
  isDrawerOpen: boolean
  
  // Actions
  addEvent: (event: Omit<AppEvent, 'id' | 'className'>) => void
  updateEvent: (id: string, event: Partial<AppEvent>) => void
  deleteEvent: (id: string) => void
  toggleFilter: (category: EventCategory) => void
  setSearchQuery: (query: string) => void
  
  // UI Actions
  openAddModal: (date?: Date) => void
  closeAddModal: () => void
  openEventDrawer: (event: AppEvent) => void
  closeEventDrawer: () => void
}

const INITIAL_EVENTS: AppEvent[] = []

export const useEventStore = create<EventState>((set) => ({
  events: [],
  activeFilters: ['Meeting', 'Holiday', 'Deadline', 'Training', 'Default'],
  searchQuery: '',
  isAddModalOpen: false,
  selectedDate: null,
  selectedEvent: null,
  isDrawerOpen: false,

  addEvent: (newEvent) => set((state) => {
    const className = `event-${newEvent.category.toLowerCase()}`
    const event = { ...newEvent, id: Math.random().toString(36).substr(2, 9), className }
    return { events: [...state.events, event] }
  }),
  
  updateEvent: (id, updatedFields) => set((state) => ({
    events: state.events.map(ev => {
      if (ev.id === id) {
        const cat = updatedFields.category || ev.category
        return { ...ev, ...updatedFields, className: `event-${cat.toLowerCase()}` }
      }
      return ev
    })
  })),

  deleteEvent: (id) => set((state) => ({
    events: state.events.filter(ev => ev.id !== id)
  })),

  toggleFilter: (category) => set((state) => ({
    activeFilters: state.activeFilters.includes(category)
      ? state.activeFilters.filter(c => c !== category)
      : [...state.activeFilters, category]
  })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  openAddModal: (date = new Date()) => set({ isAddModalOpen: true, selectedDate: date }),
  closeAddModal: () => set({ isAddModalOpen: false, selectedDate: null }),
  
  openEventDrawer: (event) => set({ isDrawerOpen: true, selectedEvent: event }),
  closeEventDrawer: () => set({ isDrawerOpen: false, selectedEvent: null })
}))
