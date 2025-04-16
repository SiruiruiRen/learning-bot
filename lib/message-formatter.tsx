import MarkdownRenderer from "@/components/markdown-renderer";
import { ReactNode } from "react";

/**
 * A unified message formatter utility to be used across all chat components
 * 
 * @param content The message content to format
 * @param phase Optional phase identifier for phase-specific formatting
 * @returns Formatted ReactNode with appropriate styling
 */
export function formatMessageContent(content: string, phase?: string): ReactNode {
  if (!content || typeof content !== 'string') return null;
  
  // Remove instructor metadata from the message (appears as HTML comments)
  let cleanedContent = content.replace(/<!--\s*INSTRUCTOR_METADATA[\s\S]*?-->/g, '');
  
  // Extract sections using section headers pattern
  const sections: {[key: string]: string} = {
    intro: "",
    assessment: "",
    guidance: "",
    nextSteps: ""
  };
  
  // Simple section extraction
  const lines = cleanedContent.split('\n');
  let currentSection = "intro";
  
  for (const line of lines) {
    // Check for section markers
    if (line.includes("Assessment") || line.includes("⚠️") || 
        line.includes("Looking at your") || line.includes("Progress Checks:")) {
      currentSection = "assessment";
      continue;
    }
    else if (line.includes("Guidance") || line.includes("💡") || 
            line.includes("template") || line.includes("PROGRESS METRICS:") ||
            line.includes("REFLECTION SCHEDULE:") || line.includes("ADAPTATION TRIGGERS")) {
      currentSection = "guidance";
      continue;
    }
    else if (line.includes("Next Steps") || line.includes("📝") || 
            line.includes("Please revise") || line.includes("revise your")) {
      currentSection = "nextSteps";
      continue;
    }
    
    // Add line to current section
    sections[currentSection] += line + '\n';
  }
  
  // Trim whitespace
  Object.keys(sections).forEach(key => {
    sections[key] = sections[key].trim();
  });
  
  // If no sections were identified, render with minimal styling
  if (!sections.assessment && !sections.guidance && !sections.nextSteps) {
    return (
      <div className="border-l-4 border-teal-500/40 pl-3 rounded">
        <MarkdownRenderer content={cleanedContent} />
      </div>
    );
  }

  // Return formatted content with simple styling
  return (
    <div className="flex flex-col space-y-4">
      {sections.intro && (
        <div className="text-white/90">
          <MarkdownRenderer content={sections.intro} />
        </div>
      )}
      
      {sections.assessment && (
        <div className="border-l-4 border-amber-500 pl-3 py-2 rounded-md">
          <div className="text-amber-400 font-medium text-lg mb-2 flex items-center">
            <span className="text-amber-400 mr-2">⚠️</span>
            <span>Assessment</span>
          </div>
          <MarkdownRenderer content={sections.assessment} />
        </div>
      )}
      
      {sections.guidance && (
        <div className="border-l-4 border-teal-500 pl-3 py-2 rounded-md">
          <div className="text-teal-400 font-medium text-lg mb-2 flex items-center">
            <span className="text-teal-400 mr-2">💡</span>
            <span>Guidance</span>
          </div>
          <MarkdownRenderer content={sections.guidance} />
        </div>
      )}
      
      {sections.nextSteps && (
        <div className="border-l-4 border-blue-500 pl-3 py-2 rounded-md">
          <div className="text-blue-400 font-medium text-lg mb-2 flex items-center">
            <span className="text-blue-400 mr-2">📝</span>
            <span>Next Steps</span>
          </div>
          <MarkdownRenderer content={sections.nextSteps} />
        </div>
      )}
    </div>
  );
}

/**
 * Extract clickable options from content
 * A simplified version of chat-message-parser functionality
 */
export function extractOptions(content: string): string[] {
  if (!content) return [];
  
  const options: string[] = [];
  
  // Extract bullet points options
  const bulletMatch = content.match(/\n[\-•]\s+([^\n]+)/g);
  if (bulletMatch) {
    bulletMatch.forEach(match => {
      options.push(match.trim().replace(/^[\-•]\s+/, ''));
    });
  }
  
  // Extract numbered options
  const numberedMatch = content.match(/\n\d+\.\s+([^\n]+)/g);
  if (numberedMatch) {
    numberedMatch.forEach(match => {
      options.push(match.trim().replace(/^\d+\.\s+/, ''));
    });
  }
  
  return options;
} 