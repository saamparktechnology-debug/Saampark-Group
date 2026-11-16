import { OrgService } from "@/services/orgService"
import { Team, TeamFormValues } from "../types"

export const teamFeatureService = {
  async getAll(): Promise<Team[]> {
    const data = await OrgService.getTeams()
    return Array.isArray(data) ? data : []
  },

  async create(values: TeamFormValues): Promise<Team> {
    return OrgService.createTeam({ ...values, status: "Active" })
  },

  async update(id: string, values: TeamFormValues): Promise<Team> {
    return OrgService.updateTeam(id, { ...values, status: "Active" })
  },

  async remove(id: string): Promise<void> {
    return OrgService.deleteTeam(id)
  },

  async removeMember(teamId: string, userId: string): Promise<void> {
    return OrgService.removeTeamMember(teamId, userId)
  },
}
