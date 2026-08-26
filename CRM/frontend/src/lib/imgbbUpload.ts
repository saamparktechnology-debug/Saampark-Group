/**
 * ImgBB Free Cloud Image & Document Upload Utility
 * Uploads images, avatars, and KYC documents to free permanent hosting
 * without bloating the local database or local storage.
 */

// Public free ImgBB API key (can be overridden via NEXT_PUBLIC_IMGBB_API_KEY environment variable)
const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || "d3e020e9803b9e4a812df88283ae99a0"

export interface UploadResult {
  url: string
  display_url?: string
  thumb_url?: string
  delete_url?: string
  success: boolean
}

/**
 * Upload a File, Blob, or base64 data string to ImgBB
 * @param fileOrBase64 - File instance, Blob, or base64 data URL string
 * @param name - Optional name for the uploaded file
 * @returns Promise<UploadResult>
 */
export async function uploadToImgBB(
  fileOrBase64: File | Blob | string,
  name: string = "upload"
): Promise<UploadResult> {
  try {
    const formData = new FormData()

    if (typeof fileOrBase64 === "string") {
      // If base64 data URL (e.g. data:image/png;base64,...), strip prefix or pass directly
      const base64Clean = fileOrBase64.includes(",")
        ? fileOrBase64.split(",")[1]
        : fileOrBase64
      formData.append("image", base64Clean)
    } else {
      formData.append("image", fileOrBase64)
    }

    formData.append("name", name.replace(/[^a-zA-Z0-9_-]/g, "_"))

    const endpoint = `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`ImgBB upload failed with status ${response.status}`)
    }

    const data = await response.json()

    if (data && data.success && data.data) {
      return {
        url: data.data.url || data.data.display_url,
        display_url: data.data.display_url,
        thumb_url: data.data.thumb?.url || data.data.medium?.url,
        delete_url: data.data.delete_url,
        success: true,
      }
    } else {
      throw new Error(data?.error?.message || "Unknown error uploading image")
    }
  } catch (err: any) {
    console.warn("ImgBB upload fallback warning:", err?.message || err)
    
    // Fallback: If File/Blob, convert to Base64 data URL so the user never loses their uploaded image
    if (typeof fileOrBase64 !== "string") {
      const base64 = await fileToBase64(fileOrBase64)
      return {
        url: base64,
        display_url: base64,
        success: true,
      }
    }

    return {
      url: fileOrBase64,
      display_url: fileOrBase64,
      success: true,
    }
  }
}

/**
 * Helper to convert File or Blob to Base64 data URL
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}
