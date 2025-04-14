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
      className="mb-2 bg-blue-600 hover:bg-blue-700 text-white w-full text-left justify-start p-3 rounded-md transition-colors"
      variant="ghost"
    >
      {text}
    </Button>
  )
} 