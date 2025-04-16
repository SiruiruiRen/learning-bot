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
  
  // Debug logs
  console.log("Phase:", phase);
  console.log("Content starts with:", cleanedContent.substring(0, 100));
  
  // Common indicators for different sections
  const hasAssessment = content.includes("## Assessment") || 
                      content.includes("Assessment:") || 
                      content.includes("Looking at your") || 
                      content.includes("⚠️") ||
                      content.includes("Progress Checks:") ||
                      content.includes("Looking at your monitoring");
                      
  const hasGuidance = content.includes("## Guidance") || 
                    content.includes("Guidance:") || 
                    content.includes("Here's a template") || 
                    content.includes("Let's develop") ||
                    content.includes("template") || 
                    content.includes("Since we're") ||
                    content.includes("Complete this template:") ||
                    content.includes("PROGRESS METRICS:") ||
                    content.includes("Since this needs more detail");
                    
  const hasNextSteps = content.includes("## Next Steps") || 
                      content.includes("Next Steps:") || 
                      content.includes("Please revise") || 
                      content.includes("📝") ||
                      content.includes("revise your") ||
                      content.includes("filling in the specifics");
  
  // Debug logs for section detection                    
  console.log("Has sections:", { hasAssessment, hasGuidance, hasNextSteps });
  
  // If no section indicators, render with minimal styling
  if (!hasAssessment && !hasGuidance && !hasNextSteps) {
    console.log("No sections detected, using minimal styling");
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
         line.includes("Assessment") ||
         line.match(/•\s+Progress\s+Checks:/i) ||
         line.match(/•\s+[^:]+:\s+⚠️/i))) {
      currentSection = "assessment";
    }
    else if (currentSection !== "intro" && !currentSection.includes("nextSteps") && (
              line.includes("Complete this template") || 
              line.includes("Since your") ||
              line.includes("Since we're") ||
              line.includes("Since this needs") ||
              line.match(/PROGRESS METRICS:/) ||
              line.includes("template:") ||
              line.includes("REFLECTION SCHEDULE:") ||
              line.includes("ADAPTATION TRIGGERS"))) {
      currentSection = "guidance";
    }
    else if (line.includes("Please revise") || 
              line.includes("Remember") || 
              line.includes("📝") ||
              line.match(/^\d+\.\s+If\s+\_+/) ||
              line.includes("revise your") ||
              line.includes("filling in the specifics")) {
      currentSection = "nextSteps";
    }
    
    // Add line to current section
    sections[currentSection] += line + '\n';
  }
  
  // Trim whitespace
  Object.keys(sections).forEach(key => {
    sections[key] = sections[key].trim();
  });

  // Log the extracted sections for debugging
  console.log("Extracted sections:", {
    introLength: sections.intro.length,
    assessmentLength: sections.assessment.length,
    guidanceLength: sections.guidance.length,
    nextStepsLength: sections.nextSteps.length
  });
  
  // Log the first 100 chars of each section for diagnosis
  if (sections.assessment.length > 0) {
    console.log("Assessment section start:", sections.assessment.substring(0, 100));
  }
  if (sections.guidance.length > 0) {
    console.log("Guidance section start:", sections.guidance.substring(0, 100));
  }
  if (sections.nextSteps.length > 0) {
    console.log("Next Steps section start:", sections.nextSteps.substring(0, 100));
  }
  
  // Format assessment content to improve table-like structure
  const formatAssessmentContent = (content: string) => {
    const formattedContent = [];
    const lines = content.split('\n');
    let isInsideTable = false;
    let tableRows = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect if this line is a criteria line using simple patterns
      // Format: "• Criteria Name: ⚠️ Text" or "- Criteria Name: [Text] Message"
      if (line.match(/^\s*[•-]\s+([^:]+):\s*(\[.*?\]|\⚠️|\💡|\✅)/)) {
        // If we find a criteria line, we're in a table section
        if (!isInsideTable) {
          isInsideTable = true;
        }
        
        // Get the parts (criteria name and value)
        const parts = line.split(':');
        const criteriaName = parts[0].replace(/^\s*[•-]\s+/, '').trim();
        const criteriaValue = parts.slice(1).join(':').trim();
        
        // Add to table rows
        tableRows.push({ criteriaName, criteriaValue });
      } else if (isInsideTable) {
        // If we were in a table and hit a non-table line, render the table
        formattedContent.push(
          <div key={`table-${i}`} className="bg-slate-800/40 rounded-md mb-4 overflow-hidden shadow-sm">
            <table className="w-full border-collapse border border-slate-600">
              <tbody>
                {tableRows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`} className={rowIndex % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/50"}>
                    <td className="py-2 px-3 border-r border-slate-600 w-1/3 font-medium text-slate-200">
                      {row.criteriaName}
                    </td>
                    <td className="py-2 px-3 border-t border-slate-700">
                      {row.criteriaValue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
        // Reset table tracking
        isInsideTable = false;
        tableRows = [];
        
        // Add the current non-table line
        formattedContent.push(<p key={`text-${i}`}>{line}</p>);
      } else {
        // Regular text line outside a table
        formattedContent.push(<p key={`text-${i}`}>{line}</p>);
      }
    }
    
    // If we ended while still having table rows, render the final table
    if (isInsideTable && tableRows.length > 0) {
      formattedContent.push(
        <div key="final-table" className="bg-slate-800/40 rounded-md mb-4 overflow-hidden shadow-sm">
          <table className="w-full border-collapse border border-slate-600">
            <tbody>
              {tableRows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`} className={rowIndex % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/50"}>
                  <td className="py-2 px-3 border-r border-slate-600 w-1/3 font-medium text-slate-200">
                    {row.criteriaName}
                  </td>
                  <td className="py-2 px-3 border-t border-slate-700">
                    {row.criteriaValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    // If we didn't find any formatted content, just render the original markdown
    if (formattedContent.length === 0) {
      return <MarkdownRenderer content={content} />;
    }
    
    return <div className="space-y-2">{formattedContent}</div>;
  };
  
  // Return formatted content with enhanced styling for each section
  return (
    <div className="flex flex-col space-y-4">
      {sections.intro && (
        <div className="text-white/90">
          <MarkdownRenderer content={sections.intro} />
        </div>
      )}
      
      {sections.assessment && (
        <div className="border-l-4 border-amber-500 pl-3 py-3 bg-slate-800/40 rounded-md shadow-md">
          <div className="text-amber-400 font-medium text-lg mb-3 flex items-center">
            <span className="text-amber-400 mr-2 text-xl">⚠️</span>
            Assessment
          </div>
          {formatAssessmentContent(sections.assessment)}
        </div>
      )}
      
      {sections.guidance && (
        <div className={`border-l-4 ${phase === 'phase5' ? 'border-purple-500' : 'border-teal-500'} py-3 rounded-md overflow-hidden shadow-md`}>
          <div className={`${phase === 'phase5' ? 'bg-purple-800/20' : 'bg-teal-800/20'} mb-3 py-2 pl-3 border-b ${phase === 'phase5' ? 'border-purple-500/30' : 'border-teal-500/30'}`}>
            <div className={`${phase === 'phase5' ? 'text-purple-300' : 'text-teal-300'} font-semibold text-lg flex items-center`}>
              <span className={`${phase === 'phase5' ? 'text-purple-300' : 'text-teal-300'} mr-2 text-xl`}>💡</span>
              Guidance
            </div>
          </div>
          <div className="bg-slate-800/40 px-4 py-3 border border-slate-700/60">
            <MarkdownRenderer content={sections.guidance} className="prose prose-invert max-w-none text-slate-100" />
          </div>
        </div>
      )}
      
      {sections.nextSteps && (
        <div className="border-l-4 border-blue-500 pl-3 py-3 bg-slate-800/40 rounded-md shadow-md">
          <div className="text-blue-400 font-medium text-lg mb-3 flex items-center">
            <span className="text-blue-400 mr-2 text-xl">📝</span>
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