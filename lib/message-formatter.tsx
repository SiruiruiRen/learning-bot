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
  
  // Detect if this is a Claude response format
  const isClaudeResponse = 
    content.includes("Looking at your learning objective") || 
    content.includes("Looking at your SMART goal") || 
    content.includes("Looking at your implementation intention") || 
    content.includes("Looking at your monitoring & adaptation system") || 
    content.includes("Looking at your long-term goal") ||
    content.includes("👋 Hello") || 
    content.includes("Hi there! 👋");
  
  // Special handling for Claude responses
  if (isClaudeResponse) {
    const lines = cleanedContent.split('\n');
    let currentSection = "intro";
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect assessment section in Claude response format
      // This looks for the assessment patterns like "Looking at X:" with bullet points
      if (line.includes("Looking at your") || 
          line.includes("• Goal Clarity:") || 
          line.includes("• Specific Goal:") ||
          line.includes("• Task Identification:") ||
          line.includes("• Resource Specificity:") ||
          line.includes("• If-Then Structure:") ||
          line.includes("• Response Specificity:") ||
          line.includes("• Feasibility:") ||
          line.includes("• Progress Checks:") ||
          line.includes("• Adaptation Triggers:") ||
          line.includes("• Strategy Alternatives:") ||
          line.includes("• Goal Orientation:") ||
          line.includes("• Visualization:") ||
          line.includes("• Action Plan:") ||
          line.includes("• Timeline:")) {
        currentSection = "assessment";
        sections[currentSection] += line + '\n';
        
        // Continue collecting assessment section until guidance
        while (i + 1 < lines.length && 
              !lines[i + 1].includes("Let's") && 
              !lines[i + 1].includes("Since") && 
              !lines[i + 1].includes("Here's a template") && 
              !lines[i + 1].includes("I'll provide a template") &&
              !lines[i + 1].includes("I'll help you") &&
              !lines[i + 1].includes("Let me help")) {
          i++;
          sections[currentSection] += lines[i] + '\n';
        }
        continue;
      }
      
      // Detect guidance section in Claude response
      if (line.includes("Let's") || 
          line.includes("Since") || 
          line.includes("Here's a template") || 
          line.includes("I'll provide a template") ||
          line.includes("I'll help you") ||
          line.includes("Let me help") ||
          line.includes("template to help")) {
        currentSection = "guidance";
        sections[currentSection] += line + '\n';
        
        // Continue collecting guidance section until next steps
        while (i + 1 < lines.length && 
              !lines[i + 1].includes("Next Steps") && 
              !lines[i + 1].includes("📝 Please revise") && 
              !lines[i + 1].includes("Please revise") &&
              !lines[i + 1].includes("Remember:")) {
          i++;
          sections[currentSection] += lines[i] + '\n';
        }
        continue;
      }
      
      // Detect next steps section in Claude response
      if (line.includes("Next Steps") || 
          line.includes("📝 Please revise") || 
          line.includes("Please revise") ||
          line.includes("Remember:") ||
          line.includes("📝 Next Steps:")) {
        currentSection = "nextSteps";
        sections[currentSection] += line + '\n';
        
        // Collect all remaining lines to next steps except instructor metadata
        while (i + 1 < lines.length && 
              !lines[i + 1].includes("<!-- INSTRUCTOR_METADATA")) {
          i++;
          sections[currentSection] += lines[i] + '\n';
        }
        continue;
      }
      
      // Add line to current section if not specifically handled above
      sections[currentSection] += line + '\n';
    }
  }
  // Special handling for contingency plans
  else if (isContingencyPlan) {
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