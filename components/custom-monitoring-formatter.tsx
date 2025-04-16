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
  
  // Improved section extraction
  const lines = content.split('\n');
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
          <div className="text-amber-400 font-medium text-lg mb-3 flex items-center" style={{display: 'flex', alignItems: 'center'}}>
            <span className="text-amber-400 mr-2 text-xl">⚠️</span>
            <span className="text-amber-400 font-bold block">Assessment</span>
          </div>
          <div className="space-y-2">
            <MarkdownRenderer content={sections.assessment} />
          </div>
        </div>
      )}
      
      {sections.guidance && (
        <div className={`border-l-4 ${phase === 'phase5' ? 'border-purple-500' : 'border-teal-500'} py-3 rounded-md overflow-hidden shadow-md`}>
          <div className={`${phase === 'phase5' ? 'bg-purple-800/20' : 'bg-teal-800/20'} mb-3 py-2 pl-3 border-b ${phase === 'phase5' ? 'border-purple-500/30' : 'border-teal-500/30'}`} style={{display: 'block'}}>
            <div className={`${phase === 'phase5' ? 'text-purple-300' : 'text-teal-300'} font-semibold text-lg flex items-center`} style={{display: 'flex', alignItems: 'center'}}>
              <span className={`${phase === 'phase5' ? 'text-purple-300' : 'text-teal-300'} mr-2 text-xl`}>💡</span>
              <span className={`${phase === 'phase5' ? 'text-purple-300' : 'text-teal-300'} font-bold block`}>Guidance</span>
            </div>
          </div>
          <div className="bg-slate-800/40 px-4 py-3 border border-slate-700/60">
            <MarkdownRenderer content={sections.guidance} className="prose prose-invert max-w-none text-slate-100" />
          </div>
        </div>
      )}
      
      {sections.nextSteps && (
        <div className="border-l-4 border-blue-500 pl-3 py-3 bg-slate-800/40 rounded-md shadow-md">
          <div className="text-blue-400 font-medium text-lg mb-3 flex items-center" style={{display: 'flex', alignItems: 'center'}}>
            <span className="text-blue-400 mr-2 text-xl">📝</span>
            <span className="text-blue-400 font-bold block">Next Steps</span>
          </div>
          <MarkdownRenderer content={sections.nextSteps} />
        </div>
      )}
    </div>
  );
} 