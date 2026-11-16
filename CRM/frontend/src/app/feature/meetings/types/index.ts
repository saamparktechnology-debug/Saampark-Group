export interface Meeting {
  id: string
  title: string
  date?: string
  duration?: string
  location?: string
  status: string
  organizer?: string
  attendees?: string[]
}

export interface MeetingFormValues {
  title: string
  date: string
  duration: string
  location: string
  status: string
  organizer: string
  attendees: string
}
