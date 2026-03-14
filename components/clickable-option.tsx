"use client"

import { Button } from "@/components/ui/button"

interface ClickableOptionProps {
  text: string
  onClick: () => void
}

export default function ClickableOption({ text, onClick }: ClickableOptionProps) {
  return (
    <Button
      onClick={onClick}
      className="mb-2 text-white w-full text-left justify-start p-3 rounded-md transition-opacity hover:opacity-90 whitespace-normal break-words h-auto"
      style={{ background: "linear-gradient(135deg, #b8892e, #96722d)" }}
      variant="ghost"
    >
      {text}
    </Button>
  )
} 