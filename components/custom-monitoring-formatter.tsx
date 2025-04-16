import MarkdownRenderer from "@/components/markdown-renderer";
import { ReactNode } from "react";

/**
 * Custom formatter for monitoring/adaptation phase to ensure section titles are visible
 * 
 * @param content The message content to format
 * @param phase Phase identifier
 * @returns Formatted ReactNode with appropriate styling
 */
export function formatMonitoringContent(content: string, phase?: string): ReactNode {
  if (!content || typeof content !== 'string') return null;
  
  // Extract sections using explicit section headers pattern only
  const sections: {[key: string]: string} = {
    intro: "",
    assessment: "",
    guidance: "",
    nextSteps: ""
  };
  
  // Simple section extraction - only look for explicit ## headers
  const lines = content.split('\n');
  let currentSection = "intro";
  
  for (const line of lines) {
    // Check for exact section headers only
    if (line.startsWith("## Assessment")) {
      currentSection = "assessment";
      continue;
    }
    else if (line.startsWith("## Guidance")) {
      currentSection = "guidance";
      continue;
    }
    else if (line.startsWith("## Next Steps")) {
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
  
  // If no explicit sections were identified, render with minimal styling
  if (!sections.assessment && !sections.guidance && !sections.nextSteps) {
    return (
      <div className="border-l-4 border-teal-500/40 pl-3 rounded">
        <MarkdownRenderer content={content} />
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
            <span>Assessment</span>
          </div>
          <MarkdownRenderer content={sections.assessment} />
        </div>
      )}
      
      {sections.guidance && (
        <div className="border-l-4 border-teal-500 pl-3 py-2 rounded-md">
          <div className="text-teal-400 font-medium text-lg mb-2 flex items-center">
            <span>Guidance</span>
          </div>
          <MarkdownRenderer content={sections.guidance} />
        </div>
      )}
      
      {sections.nextSteps && (
        <div className="border-l-4 border-blue-500 pl-3 py-2 rounded-md">
          <div className="text-blue-400 font-medium text-lg mb-2 flex items-center">
            <span>Next Steps</span>
          </div>
          <MarkdownRenderer content={sections.nextSteps} />
        </div>
      )}
    </div>
  );
} 