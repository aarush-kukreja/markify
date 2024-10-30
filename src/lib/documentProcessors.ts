export type StructureConfig = {
  headingDepth: number;
  listStyle: 'bullet' | 'numbered';
  paragraphSpacing: 'single' | 'double';
  emphasisStyle: 'asterisk' | 'underscore';
  codeBlockStyle: 'indented' | 'fenced';
};

export const processDocument = (
  text: string, 
  config: StructureConfig
): string => {
  // Split into sections based on potential headers
  const sections = text.split(/(?=\n[A-Z][^.!?]*[:.\n])/g);
  
  let markdown = '';
  
  sections.forEach(section => {
    // Process potential headers
    const lines = section.trim().split('\n');
    let currentLine = lines[0];
    
    // Detect and convert headers
    if (/^[A-Z][^.!?]*[:.\n]/.test(currentLine)) {
      const headerLevel = Math.min(config.headingDepth, 3);
      markdown += '#'.repeat(headerLevel) + ' ' + currentLine.trim() + '\n\n';
      lines.shift();
    }
    
    // Process remaining content
    let currentParagraph = '';
    
    lines.forEach(line => {
      line = line.trim();
      
      // Convert lists
      if (line.match(/^\d+\./)) {
        if (config.listStyle === 'bullet') {
          line = '* ' + line.replace(/^\d+\./, '').trim();
        }
      } else if (line.match(/^[-*•]/)) {
        if (config.listStyle === 'numbered') {
          // Convert to numbered list if not already
          const listNumber = markdown.split('\n').filter(l => l.match(/^\d+\./)).length + 1;
          line = `${listNumber}. ` + line.replace(/^[-*•]/, '').trim();
        }
      }
      
      // Convert emphasis
      if (config.emphasisStyle === 'asterisk') {
        line = line.replace(/_([^_]+)_/g, '*$1*');
        line = line.replace(/__([^_]+)__/g, '**$1**');
      } else {
        line = line.replace(/\*([^*]+)\*/g, '_$1_');
        line = line.replace(/\*\*([^*]+)\*\*/g, '__$1__');
      }
      
      // Handle code blocks
      if (line.match(/^( {4}|\t)/)) {
        if (config.codeBlockStyle === 'fenced') {
          if (!markdown.endsWith('```\n')) {
            markdown += '```\n';
          }
          line = line.replace(/^( {4}|\t)/, '');
        }
      } else if (markdown.endsWith('```\n') && config.codeBlockStyle === 'fenced') {
        markdown += '```\n\n';
      }
      
      // Add to current paragraph or create new one
      if (line === '') {
        if (currentParagraph) {
          markdown += currentParagraph + '\n';
          markdown += config.paragraphSpacing === 'double' ? '\n' : '';
          currentParagraph = '';
        }
      } else {
        currentParagraph += (currentParagraph ? ' ' : '') + line;
      }
    });
    
    // Add final paragraph
    if (currentParagraph) {
      markdown += currentParagraph + '\n\n';
    }
  });
  
  return markdown.trim();
};

export const validateMarkdown = (markdown: string): boolean => {
  // Basic markdown validation
  const hasValidHeaders = /^#{1,6} [^\n]+/m.test(markdown);
  const hasBalancedEmphasis = (markdown.match(/\*/g) || []).length % 2 === 0;
  const hasBalancedCodeBlocks = (markdown.match(/```/g) || []).length % 2 === 0;
  
  return hasValidHeaders && hasBalancedEmphasis && hasBalancedCodeBlocks;
}; 