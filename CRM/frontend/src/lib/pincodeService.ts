export interface PincodeLookupResult {
  status: "Success" | "Error"
  district?: string
  state?: string
  country?: string
  places: string[]
  districts: string[]
  states: string[]
}

export async function lookupPincode(pincode: string): Promise<PincodeLookupResult | null> {
  const cleanPin = String(pincode || "").trim().replace(/\D/g, "")
  if (cleanPin.length !== 6) return null

  // 1. Try our backend proxy route first
  try {
    const res = await fetch(`/api/pincode/${cleanPin}`, { signal: AbortSignal.timeout(6000) })
    if (res.ok) {
      const data = await res.json()
      if (data && data.status === "Success") {
        return data
      }
    }
  } catch (err) {
    console.warn("[pincodeService] Backend proxy call failed, falling back to direct API:", err)
  }

  // 2. Direct postal API fallback
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, { signal: AbortSignal.timeout(6000) })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data[0] && data[0].Status === "Success" && Array.isArray(data[0].PostOffice)) {
        const postOffices: any[] = data[0].PostOffice
        const places = Array.from(new Set(postOffices.map((p: any) => p.Name).filter(Boolean))) as string[]
        const districts = Array.from(new Set(postOffices.map((p: any) => p.District).filter(Boolean))) as string[]
        const states = Array.from(new Set(postOffices.map((p: any) => p.State).filter(Boolean))) as string[]

        return {
          status: "Success",
          district: districts[0] || "",
          state: states[0] || "",
          country: postOffices[0]?.Country || "India",
          places,
          districts,
          states,
        }
      }
    }
  } catch (err) {
    console.warn("[pincodeService] Direct postal API lookup error:", err)
  }

  return null
}
