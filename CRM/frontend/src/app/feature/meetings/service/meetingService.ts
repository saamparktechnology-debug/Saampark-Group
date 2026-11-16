import { MeetingService } from "@/services/crmCoreService"
import { Meeting, MeetingFormValues } from "../types"

function toPayload(values: MeetingFormValues) {
  return {
    ...values,
    attendees: values.attendees
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean),
  }
}

export const meetingFeatureService = {
  async getAll(): Promise<Meeting[]> {
    const data = await MeetingService.getAll({})
    return Array.isArray(data) ? data : []
  },

  async create(values: MeetingFormValues): Promise<Meeting> {
    return MeetingService.create(toPayload(values))
  },

  async update(id: string, values: MeetingFormValues): Promise<Meeting> {
    return MeetingService.update(id, toPayload(values))
  },

  async remove(id: string): Promise<void> {
    return MeetingService.delete(id)
  },
}
