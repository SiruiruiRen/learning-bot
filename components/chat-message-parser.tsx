"use client"

import { ReactNode } from "react"
import MarkdownRenderer from "./markdown-renderer"
import OptionsGroup from "./options-group"

interface ChatMessageParserProps {
  content: string
  onOptionSelect: (selected: string) => void
}

// Updated patterns to better match the intro text options
// This will match lists that follow this pattern:
// - Option 1
// - Option 2
// OR
// Option1
// Option2
// OR
// What year are you in school?
// 
// Freshman
// Sophomore
// Junior
// ...etc
const LIST_OPTION_PATTERNS = [
  // Match options like "Freshman", "Sophomore", etc. that come after a question
  /(\?|\n)\s*\n(([A-Z][a-zA-Z]*(\s+[a-zA-Z]+)*)\n)+/g,
  
  // Match options like "Very confident", "Somewhat confident", etc.
  /\n(([A-Z][a-zA-Z]*(\s+[a-zA-Z]+)*)\n)+/g,
  
  // Match options with bullets or dashes
  /\n[\-•]\s+([^\n]+)(\n[\-•]\s+([^\n]+))+/g
]

export default function ChatMessageParser({ 
  content, 
  onOptionSelect 
}: ChatMessageParserProps): ReactNode {
  if (!content || typeof content !== 'string') return null
  
  // Create a working copy of the content
  let workingContent = content
  
  // Flag to track if options were found
  let hasOptions = false
  
  // The segments to render
  const segments: ReactNode[] = []
  
  // Process the content for each pattern type
  LIST_OPTION_PATTERNS.forEach((pattern, patternIndex) => {
    // Reset the regex state
    pattern.lastIndex = 0
    
    // Create a temporary working copy for this pattern
    let tempContent = workingContent
    let lastIndex = 0
    const tempSegments: ReactNode[] = []
    let matchFound = false
    
    // Find all matches for this pattern
    let match: RegExpExecArray | null
    while ((match = pattern.exec(tempContent)) !== null) {
      matchFound = true
      hasOptions = true
      
      // Add the text before the options
      if (match.index > lastIndex) {
        tempSegments.push(
          <MarkdownRenderer 
            key={`text-${patternIndex}-${lastIndex}`} 
            content={tempContent.substring(lastIndex, match.index)} 
          />
        )
      }
      
      // Extract option texts from the match
      let optionsText = match[0].trim()
      
      // Clean up the options text based on pattern type
      let options: string[] = []
      
      if (patternIndex === 2) {
        // For bullet/dash lists
        options = optionsText
          .split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
          .map(line => line.trim().replace(/^[\-•]\s+/, ''))
      } else {
        // For plain lists
        options = optionsText
          .split('\n')
          .filter(line => line.trim() && !line.trim().endsWith('?'))
          .map(line => line.trim())
      }
      
      // Add the options group if we have valid options
      if (options.length > 0) {
        tempSegments.push(
          <OptionsGroup 
            key={`options-${patternIndex}-${match.index}`}
            options={options}
            onSelect={onOptionSelect} 
            multiSelect={false}
          />
        )
      }
      
      lastIndex = match.index + match[0].length
    }
    
    // Add remaining text after the last options for this pattern
    if (matchFound && lastIndex < tempContent.length) {
      tempSegments.push(
        <MarkdownRenderer 
          key={`text-${patternIndex}-end`} 
          content={tempContent.substring(lastIndex)} 
        />
      )
    }
    
    // If we found matches for this pattern, update the working content for the next pattern
    if (matchFound) {
      segments.push(...tempSegments)
      workingContent = "" // Clear working content to avoid duplicate processing
    }
  })
  
  // If no options were found, render the entire content as markdown
  if (!hasOptions || segments.length === 0) {
    return <MarkdownRenderer content={content} />
  }
  
  return <>{segments}</>
} 