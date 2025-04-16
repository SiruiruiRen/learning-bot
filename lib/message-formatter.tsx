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
  
  // Extract sections using explicit section headers pattern only
  const sections: {[key: string]: string} = {
    intro: "",
    assessment: "",
    guidance: "",
    nextSteps: ""
  };
  
  // Detect if this is a contingency plan format
  const isContingencyPlan = 
    content.includes("Looking at your implementation intentions") || 
    (content.includes("If-Then Structure:") && content.includes("Response Specificity:") && content.includes("Feasibility:"));
  
  // Special handling for contingency plans
  if (isContingencyPlan) {
    const lines = cleanedContent.split('\n');
    let currentSection = "intro";
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect assessment section in contingency plan
      if (line.includes("Looking at your implementation intentions") || 
          line.includes("If-Then Structure:") || 
          line.includes("Response Specificity:") || 
          line.includes("Feasibility:")) {
        currentSection = "assessment";
        // Add this line to assessment
        sections[currentSection] += line + '\n';
        
        // Continue collecting assessment section until we hit guidance
        while (i + 1 < lines.length && 
               !lines[i + 1].includes("Let's build a stronger implementation") &&
               !lines[i + 1].includes("Here's a template")) {
          i++;
          sections[currentSection] += lines[i] + '\n';
        }
        continue;
      }
      
      // Detect guidance section in contingency plan
      if (line.includes("Let's build a stronger implementation") || 
          line.includes("Here's a template") ||
          line.includes("IF [specific sign of procrastination]")) {
        currentSection = "guidance";
        // Add this line to guidance
        sections[currentSection] += line + '\n';
        
        // Continue collecting guidance section until we hit next steps
        while (i + 1 < lines.length && 
               !lines[i + 1].includes("Please revise your implementation") &&
               !lines[i + 1].includes("Remember:")) {
          i++;
          sections[currentSection] += lines[i] + '\n';
        }
        continue;
      }
      
      // Detect next steps section in contingency plan
      if (line.includes("Please revise your implementation") || 
          line.includes("What specific behaviors signal") ||
          line.includes("Consider:")) {
        currentSection = "nextSteps";
        // Add this line and all remaining lines to next steps
        sections[currentSection] += line + '\n';
        while (i + 1 < lines.length) {
          i++;
          sections[currentSection] += lines[i] + '\n';
        }
        continue;
      }
      
      // Add line to current section if not specifically handled above
      sections[currentSection] += line + '\n';
    }
  } else {
    // Regular section extraction - only look for explicit ## headers
    const lines = cleanedContent.split('\n');
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
  }
  
  // Trim whitespace
  Object.keys(sections).forEach(key => {
    sections[key] = sections[key].trim();
  });
  
  // If no explicit sections were identified, render with minimal styling
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