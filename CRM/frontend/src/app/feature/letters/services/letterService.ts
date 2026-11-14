import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted } from "@/lib/storageSync"
import { createNotification } from "@/services/notificationService"
import { LetterRecord } from "../types"

export async function getLetters(companyId?: string): Promise<LetterRecord[]> {
  try {
    const scope = companyId || "all"
    const data = await fetchModuleDataFromDB<LetterRecord[]>("letters", [], scope).catch(() => [])
    return Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []
  } catch (err) {
    console.warn("getLetters warning:", err)
    return []
  }
}

export async function createAndSendLetter(letter: LetterRecord, companyId?: string): Promise<LetterRecord> {
  const scope = companyId || letter.companyId || "all"
  const existing = await getLetters(scope)
  const updated = [letter, ...existing]
  
  await saveModuleDataToDB("letters", updated, scope)
  if (scope !== "all") {
    const allScope = await getLetters("all")
    await saveModuleDataToDB("letters", [letter, ...allScope.filter(l => l.id !== letter.id)], "all")
  }

  // Dispatch In-App Notification to all selected recipients
  for (const recipient of letter.recipients) {
    if (recipient.email) {
      createNotification({
        title: `Official Letter: ${letter.title}`,
        message: `You have received an official ${letter.templateType.replace('_', ' ').toUpperCase()} from ${letter.companyName || 'Management'}. Subject: ${letter.subject}`,
        type: "system",
        targetEmail: recipient.email,
        targetUserId: recipient.id,
        linkUrl: `/feature/letters?id=${letter.id}`,
        sendEmailNotification: true,
      }).catch(() => {})
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_letter_created", { detail: letter }))
  }

  return letter
}

export async function deleteLetter(letterId: string, companyId?: string): Promise<boolean> {
  const scope = companyId || "all"
  const existing = await getLetters(scope)
  const filtered = existing.filter(l => l.id !== letterId)
  
  await markGlobalItemDeleted(letterId, "letters")
  await saveModuleDataToDB("letters", filtered, scope)
  
  if (scope !== "all") {
    const allScope = await getLetters("all")
    await saveModuleDataToDB("letters", allScope.filter(l => l.id !== letterId), "all")
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
  }

  return true
}
