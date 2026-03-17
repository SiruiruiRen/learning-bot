"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface PhaseNavigationButtonProps {
  onNavigate: () => void
  nextPhase: number
  className?: string
  style?: React.CSSProperties
  title?: string
}

export function PhaseNavigationButton({
  onNavigate,
  nextPhase,
  className,
  style,
  title,
}: PhaseNavigationButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className={className || "font-semibold"}
          style={style}
          title={title || `Continue to Phase ${nextPhase}`}
        >
          Continue to Phase {nextPhase}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ready to move on?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to proceed to Phase {nextPhase}? 
            Make sure you have completed the current activities before continuing.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onNavigate}>
            Yes, Continue to Phase {nextPhase}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
