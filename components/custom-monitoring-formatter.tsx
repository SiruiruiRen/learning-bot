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
  
  // Extract sections using section headers pattern
  const sections: {[key: string]: string} = {
    intro: "",
    assessment: "",
    guidance: "",
    nextSteps: ""
  };
  
  // Simple section extraction
  const lines = content.split('\n');
  let currentSection = "intro";
  
  for (const line of lines) {
    // Check for explicit section headers
    if (line.includes("Assessment") || line.includes("⚠️")) {
      currentSection = "assessment";
      continue;
    }
    else if (line.includes("Guidance") || line.includes("💡")) {
      currentSection = "guidance";
      continue;
    }
    else if (line.includes("Next Steps") || line.includes("📝")) {
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
  
  // Return formatted content with clean styling
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