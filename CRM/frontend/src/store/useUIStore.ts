import { create } from 'zustand'

type UIState = {
  // Global Layout
  isSidebarCollapsed: boolean
  toggleSidebar: () => void

  // All Modal States
  isTodoModalOpen: boolean
  isTimerModalOpen: boolean
  isGlobalSearchOpen: boolean
  isAddClientModalOpen: boolean
  isAddProjectModalOpen: boolean
  isAddTaskModalOpen: boolean
  isAddMemberModalOpen: boolean
  isAddLeadModalOpen: boolean
  isAddEventModalOpen: boolean
  isAddTicketModalOpen: boolean
  isComposeMessageOpen: boolean
  isAddNoteModalOpen: boolean
  isAddExpenseModalOpen: boolean
  isSendInvitationOpen: boolean
  isImportModalOpen: boolean
  isAddProposalModalOpen: boolean
  isAddEstimateModalOpen: boolean

  // Generic open/close
  openModal: (name: string) => void
  closeModal: (name: string) => void
  toggleModal: (name: string) => void
}

type ModalNames = keyof Omit<UIState, 'isSidebarCollapsed' | 'toggleSidebar' | 'openModal' | 'closeModal' | 'toggleModal'>

const MODAL_KEYS: ModalNames[] = [
  'isTodoModalOpen','isTimerModalOpen','isGlobalSearchOpen',
  'isAddClientModalOpen','isAddProjectModalOpen','isAddTaskModalOpen',
  'isAddMemberModalOpen','isAddLeadModalOpen','isAddEventModalOpen',
  'isAddTicketModalOpen','isComposeMessageOpen','isAddNoteModalOpen',
  'isAddExpenseModalOpen','isSendInvitationOpen','isImportModalOpen',
  'isAddProposalModalOpen','isAddEstimateModalOpen',
]

const initialState = Object.fromEntries(MODAL_KEYS.map(k => [k, false])) as Record<ModalNames, boolean>

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  ...initialState,

  openModal: (name: string) => set({ [name]: true } as any),
  closeModal: (name: string) => set({ [name]: false } as any),
  toggleModal: (name: string) => set((state) => ({ [name]: !(state as any)[name] } as any)),
}))
