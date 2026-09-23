"use client"

import * as React from "react"
import { UploadCloud, Image as ImageIcon, CheckCircle2, AlertCircle, X, Loader2, ExternalLink, RefreshCw } from "lucide-react"
import { uploadToImgBB } from "@/lib/imgbbUpload"

interface ImageUploadFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
  placeholder?: string
  helperText?: string
  uploadNamePrefix?: string
  aspectRatio?: "square" | "wide" | "signature"
  maxWidth?: number
  required?: boolean
  disabled?: boolean
}

export function ImageUploadField({
  label,
  value,
  onChange,
  placeholder = "https://... or upload from storage",
  helperText,
  uploadNamePrefix = "upload",
  aspectRatio = "square",
  maxWidth = 800,
  required = false,
  disabled = false,
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = React.useState(false)
  const [showUrlInput, setShowUrlInput] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image file size must be under 10MB.")
      return
    }

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(false)

    try {
      const cleanPrefix = (uploadNamePrefix || "crm_asset").toLowerCase().replace(/[^a-z0-9_-]/g, "_")
      const result = await uploadToImgBB(file, `${cleanPrefix}_${Date.now()}`, maxWidth)

      if (result && result.success && result.url) {
        onChange(result.url)
        setUploadSuccess(true)
        setTimeout(() => setUploadSuccess(false), 4000)
      } else {
        setUploadError("Upload failed. Please check your connection or try another image.")
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload image via ImgBB.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setUploadError(null)
    setUploadSuccess(false)
  }

  const containerHeight = aspectRatio === "signature" ? "h-20" : aspectRatio === "wide" ? "h-28" : "h-28"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showUrlInput ? "Hide Direct URL" : "Edit Direct URL"}
        </button>
      </div>

      {/* Main Upload / Preview Area */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {value ? (
          /* Preview State */
          <div className={`relative ${containerHeight} w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-900/50 p-2 flex items-center justify-between gap-3 overflow-hidden group`}>
            <div className="flex items-center gap-3 min-w-0 flex-1 h-full">
              <div className="h-full w-24 shrink-0 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center p-1.5 shadow-2xs overflow-hidden">
                <img
                  src={value}
                  alt={label}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    // Fallback on broken image
                    (e.currentTarget as HTMLElement).style.display = "none"
                  }}
                />
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                    Uploaded via ImgBB
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-mono">
                  {value}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Change File
                  </button>
                  <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-0.5"
                  >
                    <ExternalLink className="w-3 h-3" /> View Full
                  </a>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClear}
              disabled={disabled || isUploading}
              title="Remove image"
              className="p-1.5 rounded-lg bg-zinc-200/80 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Empty / Upload State */
          <div
            onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
            className={`w-full ${containerHeight} rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all cursor-pointer flex flex-col items-center justify-center p-3 text-center group`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs font-bold">Uploading to ImgBB cloud...</span>
                <span className="text-[10px] text-zinc-500">Compressing and generating high-res permanent URL</span>
              </div>
            ) : (
              <>
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Click to upload {label.toLowerCase()} from storage
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  PNG, JPG, WebP, SVG up to 10MB (Free permanent ImgBB hosting)
                </p>
              </>
            )}
          </div>
        )}

        {/* Optional Manual URL Input */}
        {showUrlInput && (
          <div className="mt-2 space-y-1">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled || isUploading}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 font-mono focus:outline-hidden focus:border-blue-600"
            />
          </div>
        )}

        {/* Feedback Messages */}
        {uploadError && (
          <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 pt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {uploadError}
          </p>
        )}
        {uploadSuccess && (
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Image uploaded successfully to ImgBB!
          </p>
        )}
      </div>

      {helperText && (
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
          {helperText}
        </p>
      )}
    </div>
  )
}
