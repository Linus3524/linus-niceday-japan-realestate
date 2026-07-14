export const renderFormattedText = (text: string) => {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, index) => {
    const trimmed = line.trim();
    // Match bullet points like •, -, *, or numbered lists like 1., 2.
    const match = trimmed.match(/^(\d+\.|[•\-\*])\s+(.*)/);
    if (match) {
      const bullet = match[1];
      const content = match[2];
      return (
        <div key={index} className="flex items-start gap-1.5 pl-4 mt-1">
          <span className="shrink-0 font-bold text-[#0F8F6D] font-sans">{bullet}</span>
          <span className="flex-grow">{content}</span>
        </div>
      );
    }
    return (
      <div key={index} className={line === "" ? "h-3" : (index > 0 ? "mt-1.5" : "")}>
        {line}
      </div>
    );
  });
};

export const formatMessageText = (text: string) => {
  if (!text) return "";
  
  // First, if there's *「text」*, replace it with 「text」 (remove the single asterisks around quotes)
  let cleaned = text.replace(/\*「(.*?)」\*/g, "「$1」");
  
  // Replace **text** with 「text」
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, "「$1」");
  
  // Replace *text* with 「text」
  cleaned = cleaned.replace(/\*(.*?)\*/g, "「$1」");
  
  // Also clean any stray double or single asterisks that couldn't be paired
  cleaned = cleaned.replace(/\*\*/g, "");
  cleaned = cleaned.replace(/\*/g, "");
  
  // Clean up markdown headers
  cleaned = cleaned.replace(/###\s*(.*)/g, "$1");
  cleaned = cleaned.replace(/##\s*(.*)/g, "$1");
  cleaned = cleaned.replace(/#\s*(.*)/g, "$1");
  return cleaned;
};
