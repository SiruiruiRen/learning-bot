// Process chat message to convert markdown
const processMessageContent = (content: string) => {
  // Special case for confirmation messages to display the implementation steps properly
  if (content.includes("Thank you for your responses! Here is your complete implementation plan:")) {
    return (
      <div className="flex flex-col space-y-3">
        <div>{content}</div>
        
        <div className="bg-slate-800 rounded-md border border-blue-500/50 p-4 mt-2 space-y-4">
          <div className="space-y-2">
            <h3 className="text-blue-300 font-medium">Specific Implementation Steps:</h3>
            <div className="bg-slate-700/70 p-3 rounded-md border border-slate-600 whitespace-pre-wrap">
              {responses["implementation_steps"] || ""}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-blue-300 font-medium">Timeline and Milestones:</h3>
            <div className="bg-slate-700/70 p-3 rounded-md border border-slate-600 whitespace-pre-wrap">
              {responses["timeline_milestones"] || ""}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-blue-300 font-medium">Resources Required:</h3>
            <div className="bg-slate-700/70 p-3 rounded-md border border-slate-600 whitespace-pre-wrap">
              {responses["resources_required"] || ""}
            </div>
          </div>
        </div>
        
        <div className="text-slate-300 mt-2">
          Is this your complete implementation plan? If you'd like to make any changes, click "Edit Responses". Otherwise, click "Confirm & Submit" to proceed.
        </div>
      </div>
    );
  }
  
  // Extract sections using section headers pattern
  if (content.includes("## Assessment") || content.includes("## Guidance") || content.includes("## Next Steps")) {
    // Split the content into sections
    const sections: {[key: string]: string} = {
      intro: "",
      assessment: "",
      guidance: "",
      nextSteps: ""
    };
    
    // Process the content to identify sections
    const lines = content.split('\n');
    let currentSection = "intro";
    
    for (const line of lines) {
      // Check for section markers and transition to that section
      if (line.startsWith("## Assessment")) {
        currentSection = "assessment";
        continue; // Skip the header line
      }
      else if (line.startsWith("## Guidance")) {
        currentSection = "guidance";
        continue; // Skip the header line
      }
      else if (line.startsWith("## Next Steps")) {
        currentSection = "nextSteps";
        continue; // Skip the header line
      }
      
      // Add line to current section
      sections[currentSection] += line + '\n';
    }
    
    // Clean up each section by trimming
    Object.keys(sections).forEach(key => {
      sections[key] = sections[key].trim();
    });
    
    // Format with colored borders and sections
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
            <MarkdownRenderer content={sections.assessment} />
          </div>
        )}
        
        {sections.guidance && (
          <div className="border-l-4 border-purple-500 py-3 rounded-md overflow-hidden shadow-md">
            <div className="bg-purple-800/20 mb-3 py-2 pl-3 border-b border-purple-500/30">
              <div className="text-purple-300 font-semibold text-lg flex items-center">
                <span className="text-purple-300 mr-2 text-xl">📝</span>
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
  
  // For regular messages with no special formatting
  return (
    <div className="border-l-4 border-blue-500/40 pl-3 rounded">
      <MarkdownRenderer content={content} />
    </div>
  );
} 