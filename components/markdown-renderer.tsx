"use client"

import { useEffect, useRef } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

interface MarkdownRendererProps {
  content: string
  className?: string
}

const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  const markdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (markdownRef.current && content) {
      try {
        const rawHTML = marked.parse(content, { 
          async: false,
          gfm: true, 
          breaks: true 
        }) as string
        const sanitizedHTML = DOMPurify.sanitize(rawHTML)
        markdownRef.current.innerHTML = sanitizedHTML
      } catch (error) {
        console.error('Error parsing markdown:', error)
        markdownRef.current.textContent = content
      }
    }
  }, [content])

  return (
    <div 
      ref={markdownRef} 
      className={`markdown-content ${className}`}
      style={{
        lineHeight: '1.6',
      }}
    />
  )
}

export default MarkdownRenderer 