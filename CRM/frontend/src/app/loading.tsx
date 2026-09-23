import { ThreeDotLoader } from "@/components/ui/ThreeDotLoader"

export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center pointer-events-none">
      <ThreeDotLoader text="Loading SAAMPARK Workspace..." fullScreen={false} />
    </div>
  )
}
