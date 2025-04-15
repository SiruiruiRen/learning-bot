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
        console.log("Rendering markdown:", content);
        
        // Configure marked with specific options for headings
        const markedOptions = {
          async: false,
          gfm: true,
          breaks: true,
          headerIds: false,  // Don't add IDs to headers
          mangle: false,     // Don't mangle header IDs
          headerPrefix: '',  // Don't prefix header IDs
        };
        
        const rawHTML = marked.parse(content, markedOptions) as string;
        console.log("Generated HTML:", rawHTML);
        
        const sanitizedHTML = DOMPurify.sanitize(rawHTML);
        markdownRef.current.innerHTML = sanitizedHTML;
      } catch (error) {
        console.error('Error parsing markdown:', error);
        markdownRef.current.textContent = content;
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