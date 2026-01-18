"use client"

import { motion } from "framer-motion"
import MarkdownRenderer from "@/components/markdown-renderer"
import { Sparkles, BarChart, ArrowRight } from "lucide-react"

interface FeedbackDisplayProps {
  content: string;
}

const FeedbackDisplay = ({ content }: FeedbackDisplayProps) => {
  // Split the content by "## " to get the sections
  const sections = content.split("## ").filter(s => s.trim() !== "");

  return (
    <div className="space-y-4 w-full">
      {sections.map((section, index) => {
        // Find the first newline to separate title from body
        const firstNewlineIndex = section.indexOf('\n');
        const title = firstNewlineIndex !== -1 ? section.substring(0, firstNewlineIndex).trim() : section.trim();
        const body = firstNewlineIndex !== -1 ? section.substring(firstNewlineIndex + 1).trim() : "";

        const accent = "#d8b26f"
        const neutralSurface = "hsl(var(--card))"
        const neutralBorder = "hsl(var(--border))"
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="p-4 rounded-lg border w-full"
            style={{
              backgroundColor: "hsl(var(--muted) / 0.5)",
              borderColor: neutralBorder
            }}
          >
            <h3 className="font-semibold text-base mb-2 flex items-center break-words" style={{ color: accent }}>
              {title === "Assessment" && <BarChart className="w-4 h-4 mr-2 flex-shrink-0" />}
              {title === "Guidance" && <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />}
              {title === "Next Steps" && <ArrowRight className="w-4 h-4 mr-2 flex-shrink-0" />}
              {title}
            </h3>
            <div className="text-sm break-words overflow-wrap-anywhere max-w-full overflow-hidden" style={{ color: "hsl(var(--foreground))" }}>
                <MarkdownRenderer content={body} className="max-w-full" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FeedbackDisplay; 