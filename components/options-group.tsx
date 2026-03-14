"use client"

import { useState } from "react"
import ClickableOption from "./clickable-option"

interface OptionsGroupProps {
  options: string[]
  onSelect: (selected: string) => void
  multiSelect?: boolean
}

export default function OptionsGroup({ 
  options, 
  onSelect, 
  multiSelect = false 
}: OptionsGroupProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  const handleOptionClick = (option: string) => {
    if (multiSelect) {
      // For multi-select, toggle options in the array
      if (selectedOptions.includes(option)) {
        setSelectedOptions(selectedOptions.filter(item => item !== option))
      } else {
        setSelectedOptions([...selectedOptions, option])
      }
    } else {
      // For single-select, just call onSelect directly
      onSelect(option)
    }
  }

  // For multi-select, provide a submit button
  const handleSubmit = () => {
    if (multiSelect && selectedOptions.length > 0) {
      onSelect(selectedOptions.join(", "))
    }
  }

  return (
    <div className="options-group my-3">
      {options.map((option, index) => (
        <ClickableOption 
          key={index}
          text={option} 
          onClick={() => handleOptionClick(option)} 
        />
      ))}
      
      {multiSelect && (
        <div className="mt-3">
          <button 
            onClick={handleSubmit}
            disabled={selectedOptions.length === 0}
            className={`px-4 py-2 rounded-md text-white transition-opacity ${
              selectedOptions.length > 0
                ? 'hover:opacity-90'
                : 'opacity-50 cursor-not-allowed'
            }`}
            style={{ background: selectedOptions.length > 0 ? "linear-gradient(135deg, #b8892e, #96722d)" : "hsl(35 20% 70%)" }}
          >
            Submit ({selectedOptions.length} selected)
          </button>
        </div>
      )}
    </div>
  )
} 