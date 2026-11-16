export interface ChatMessage {
  id: string
  senderEmail: string
  senderName: string
  recipientEmail: string
  recipientName: string
  text: string
  timestamp: string
  read?: boolean
}

export interface ChatContact {
  id: string
  name: string
  email: string
  role: string
  avatar: string
  status?: "Online" | "Away" | "Offline"
  lastMessage?: string
  lastTime?: string
  unreadCount?: number
  companyName?: string
  branchName?: string
}
