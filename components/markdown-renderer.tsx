"use client"

import { useEffect, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Only render on client side to avoid hydration issues
  const [renderedContent, setRenderedContent] = useState<string>('')

  useEffect(() => {
    try {
      // Parse markdown to HTML - force string type to resolve TypeScript issues
      const rawHtml = String(marked(content, {
        gfm: true,        // GitHub flavored markdown
        breaks: true      // Convert line breaks to <br>
      }))
      
      // Sanitize the HTML to prevent XSS
      const cleanHtml = DOMPurify.sanitize(rawHtml)
      setRenderedContent(cleanHtml)
    } catch (error) {
      console.error('Error rendering markdown:', error)
      setRenderedContent(content) // Fallback to raw content
    }
  }, [content])

  return (
    <div 
      className={`markdown-content compact-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  )
} 