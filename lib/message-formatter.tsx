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
  
  // Common indicators for different sections
  const hasAssessment = content.includes("## Assessment") || 
                      content.includes("Assessment:") || 
                      content.includes("Looking at your") || 
                      content.includes("⚠️");
                      
  const hasGuidance = content.includes("## Guidance") || 
                    content.includes("Guidance:") || 
                    content.includes("Here's a template") || 
                    content.includes("Let's develop") ||
                    content.includes("template") || 
                    content.includes("Since we're");
                    
  const hasNextSteps = content.includes("## Next Steps") || 
                      content.includes("Next Steps:") || 
                      content.includes("Please revise") || 
                      content.includes("📝");
  
  // If no section indicators, render with minimal styling
  if (!hasAssessment && !hasGuidance && !hasNextSteps) {
    return (
      <div className="border-l-4 border-teal-500/40 pl-3 rounded">
        <MarkdownRenderer content={cleanedContent} />
      </div>
    );
  }
  
  // Extract sections using simple approach
  const sections: {[key: string]: string} = {
    intro: "",
    assessment: "",
    guidance: "",
    nextSteps: ""
  };
  
  // Basic section extraction
  const lines = cleanedContent.split('\n');
  let currentSection = "intro";
  
  for (const line of lines) {
    // Check for section indicators
    if (line.includes("## Assessment") || line.includes("Looking at your") || 
        line.includes("Assessment:") || line.includes("⚠️")) {
      currentSection = "assessment";
      // Skip markdown heading lines
      if (line.trim() === "## Assessment") continue;
    }
    else if (line.includes("## Guidance") || line.includes("Here's a template") || 
            line.includes("Guidance:") || line.includes("Let's develop")) {
      currentSection = "guidance";
      // Skip markdown heading lines
      if (line.trim() === "## Guidance") continue;
    }
    else if (line.includes("## Next Steps") || line.includes("Please revise") || 
            line.includes("Next Steps:") || line.includes("📝")) {
      currentSection = "nextSteps";
      // Skip markdown heading lines
      if (line.trim() === "## Next Steps") continue;
    }
    
    // Add line to current section
    sections[currentSection] += line + '\n';
  }
  
  // Trim whitespace
  Object.keys(sections).forEach(key => {
    sections[key] = sections[key].trim();
  });
  
  // Return formatted content with colored sections
  return (
    <div className="flex flex-col space-y-3">
      {sections.intro && (
        <div className="text-white/90">
          <MarkdownRenderer content={sections.intro} />
        </div>
      )}
      
      {sections.assessment && (
        <div className="border-l-4 border-amber-500/70 pl-3 py-2 bg-slate-800/30 rounded-md">
          <div className="text-amber-400 font-medium text-lg mb-2">Assessment</div>
          <MarkdownRenderer content={sections.assessment} />
        </div>
      )}
      
      {sections.guidance && (
        <div className="border-l-4 border-teal-500/70 pl-3 py-2 bg-slate-800/30 rounded-md">
          <div className="text-teal-400 font-medium text-lg mb-2">Guidance</div>
          <MarkdownRenderer content={sections.guidance} />
        </div>
      )}
      
      {sections.nextSteps && (
        <div className="border-l-4 border-blue-500/70 pl-3 py-2 bg-slate-800/30 rounded-md">
          <div className="text-blue-400 font-medium text-lg mb-2">Next Steps</div>
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