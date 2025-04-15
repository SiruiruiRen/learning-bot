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
                      content.includes("⚠️") ||
                      content.includes("Progress Checks:");
                      
  const hasGuidance = content.includes("## Guidance") || 
                    content.includes("Guidance:") || 
                    content.includes("Here's a template") || 
                    content.includes("Let's develop") ||
                    content.includes("template") || 
                    content.includes("Since we're") ||
                    content.includes("Complete this template:");
                    
  const hasNextSteps = content.includes("## Next Steps") || 
                      content.includes("Next Steps:") || 
                      content.includes("Please revise") || 
                      content.includes("📝") ||
                      content.includes("revise your");
  
  // If no section indicators, render with minimal styling
  if (!hasAssessment && !hasGuidance && !hasNextSteps) {
    return (
      <div className="border-l-4 border-teal-500/40 pl-3 rounded">
        <MarkdownRenderer content={cleanedContent} />
      </div>
    );
  }
  
  // Extract sections using section headers pattern
  const sections: {[key: string]: string} = {
    intro: "",
    assessment: "",
    guidance: "",
    nextSteps: ""
  };
  
  // Improved section extraction
  const lines = cleanedContent.split('\n');
  let currentSection = "intro";
  
  for (const line of lines) {
    // Check for explicit section headers first
    if (line.match(/^#+\s*Assessment/i) || line.match(/^Assessment:/i)) {
      currentSection = "assessment";
      continue; // Skip the header line
    }
    else if (line.match(/^#+\s*Guidance/i) || line.match(/^Guidance:/i)) {
      currentSection = "guidance";
      continue; // Skip the header line
    }
    else if (line.match(/^#+\s*Next\s*Steps/i) || line.match(/^Next\s*Steps:/i)) {
      currentSection = "nextSteps";
      continue; // Skip the header line
    }
    // Then check for implicit section indicators
    else if (currentSection === "intro" && (
         line.includes("Looking at your") || 
         line.includes("⚠️") || 
         line.match(/Progress Checks:/) || 
         line.includes("Assessment"))) {
      currentSection = "assessment";
    }
    else if (currentSection !== "intro" && !currentSection.includes("nextSteps") && (
              line.includes("Complete this template") || 
              line.includes("Since your") ||
              line.includes("Since we're") ||
              line.match(/PROGRESS METRICS:/) ||
              line.includes("template:"))) {
      currentSection = "guidance";
    }
    else if (line.includes("Please revise") || 
              line.includes("Remember") || 
              line.includes("📝") ||
              line.match(/^\d+\.\s+If\s+\_+/) ||
              line.includes("revise your")) {
      currentSection = "nextSteps";
    }
    
    // Add line to current section
    sections[currentSection] += line + '\n';
  }
  
  // Trim whitespace
  Object.keys(sections).forEach(key => {
    sections[key] = sections[key].trim();
  });
  
  // Helper function to format assessment bullet points as table-like items
  const formatAssessmentContent = (content: string) => {
    // Format bullet points in assessment section to be more table-like
    const lines = content.split('\n');
    const formattedLines = lines.map(line => {
      // Match bullet points with some form of criteria + status indicator
      if (line.match(/^\s*[•-]\s+([^:]+):\s+(\[.*?\]|\⚠️|\💡|\✅)/)) {
        // Style as a table-like row with status indicator highlighted
        return (
          <div key={line} className="flex items-start space-x-2 my-1.5 border-b border-slate-700/50 pb-1.5">
            <div className="flex-shrink-0 w-1/3 text-slate-300 font-medium">
              {line.split(':')[0].replace(/^\s*[•-]\s+/, '')}:
            </div>
            <div className="flex-grow">
              {line.split(':').slice(1).join(':').trim()}
            </div>
          </div>
        );
      }
      return line;
    });
    
    // If we found formatted lines (array of JSX elements), return them directly
    if (formattedLines.some(line => typeof line !== 'string')) {
      return (
        <div className="bg-slate-800/50 rounded-md p-2 space-y-1">
          {formattedLines.map((line, index) => 
            typeof line === 'string' ? <p key={index}>{line}</p> : line
          )}
        </div>
      );
    }
    
    // Otherwise return the content as markdown
    return <MarkdownRenderer content={content} />;
  };
  
  // Return formatted content with enhanced styling for each section
  return (
    <div className="flex flex-col space-y-3">
      {sections.intro && (
        <div className="text-white/90">
          <MarkdownRenderer content={sections.intro} />
        </div>
      )}
      
      {sections.assessment && (
        <div className="border-l-4 border-amber-500/70 pl-3 py-2 bg-slate-800/30 rounded-md">
          <div className="text-amber-400 font-medium text-lg mb-2 flex items-center">
            <span className="text-amber-400 mr-2">⚠️</span>
            Assessment
          </div>
          {formatAssessmentContent(sections.assessment)}
        </div>
      )}
      
      {sections.guidance && (
        <div className="border-l-4 border-teal-500/70 py-2 rounded-md overflow-hidden">
          <div className="text-teal-400 font-medium text-lg mb-2 flex items-center pl-3">
            <span className="text-teal-400 mr-2">💡</span>
            Guidance
          </div>
          <div className="bg-slate-800/50 p-3 border-t border-b border-teal-500/20 mb-2">
            <div className="quote-block bg-slate-800/80 p-3 rounded-md border-l-[3px] border-teal-500">
              <MarkdownRenderer content={sections.guidance} className="text-slate-100" />
            </div>
          </div>
        </div>
      )}
      
      {sections.nextSteps && (
        <div className="border-l-4 border-blue-500/70 pl-3 py-2 bg-slate-800/30 rounded-md">
          <div className="text-blue-400 font-medium text-lg mb-2 flex items-center">
            <span className="text-blue-400 mr-2">📝</span>
            Next Steps
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