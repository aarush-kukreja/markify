// Updated MarkdownTransformer.ts

type Block = {
    type: 'heading' | 'paragraph' | 'list' | 'code' | 'quote';
    content: string;
    metadata?: {
      level?: number;
      listType?: 'bullet' | 'numbered';
      listIndex?: number;
    };
  };
  
  class MarkdownTransformer {
    private static instance: MarkdownTransformer;
    private commonHeadingWords: Set<string>;
    private nonHeadingWords: Set<string>;
    private metadataPatterns: Map<RegExp, number>;
    private listPatterns: RegExp[];
  
    private constructor() {
      // Common words that typically indicate headings when alone or at start
      this.commonHeadingWords = new Set([
        'overview', 'introduction', 'summary', 'conclusion',
        'background', 'method', 'results', 'discussion',
        'features', 'benefits', 'installation', 'usage',
        'api', 'faq', 'troubleshooting', 'notes',
        'prerequisites', 'requirements', 'setup', 'configuration',
        'examples', 'reference', 'contributing', 'license',
        'acknowledgments', 'appendix', 'glossary', 'index',
        'headings', 'syntax', 'formatting'
      ]);
  
      // Words that should not be considered as headings even if capitalized
      this.nonHeadingWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'nor', 'for', 'so', 'yet',
        'to', 'in', 'on', 'at', 'by', 'up', 'of', 'as', 'it', 'is',
        'be', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her',
        'its', 'our', 'their', 'nearly', 'almost', 'about', 'there'
      ]);
  
      // List patterns to detect different types of lists
      this.listPatterns = [
        /^\s*([-*+])\s+/, // Bullet points
        /^\s*\d+[\.)]\s+/, // Numbered lists
        /^\s*[a-zA-Z][\.)]\s+/, // Lettered lists
        /^\s*\(\d+\)\s+/, // Parenthesized numbers
      ];
  
      // Patterns for metadata detection
      this.metadataPatterns = new Map<RegExp, number>([
        [/^r\/[a-zA-Z0-9_]+$/, 1],
        [/^\/r\/[a-zA-Z0-9_]+$/, 1],
        [/^(About|Description|Overview|Rules|Information)$/i, 2],
        [/^(Created|Members|Online|Public|Private|Restricted)$/i, 3],
        [/^(Rank|Status|Category|Type)(\s+by\s+\w+)?$/i, 3],
        [/^(User|Moderator|Admin|Author)s?\s*(flair|info|details)?$/i, 4],
        [/^u\/[a-zA-Z0-9_-]+$/, 4],
      ]);
    }
  
    static getInstance(): MarkdownTransformer {
      if (!MarkdownTransformer.instance) {
        MarkdownTransformer.instance = new MarkdownTransformer();
      }
      return MarkdownTransformer.instance;
    }
  
    private analyzeTextStructure(text: string): Block[] {
      const lines = text.split('\n');
      const blocks: Block[] = [];
      let currentBlock: Block | null = null;
      let inCodeBlock = false;
      let codeBlockContent = '';
  
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
  
        // Handle code blocks
        if (trimmedLine.startsWith('```')) {
          if (inCodeBlock) {
            // End of code block
            inCodeBlock = false;
            blocks.push({
              type: 'code',
              content: codeBlockContent,
            });
            codeBlockContent = '';
          } else {
            // Start of code block
            inCodeBlock = true;
          }
          return;
        }
  
        if (inCodeBlock) {
          codeBlockContent += line + '\n';
          return;
        }
  
        // Handle empty lines
        if (!trimmedLine) {
          if (currentBlock && currentBlock.type !== 'list') {
            blocks.push(currentBlock);
            currentBlock = null;
          }
          return;
        }
  
        // Handle blockquotes
        if (trimmedLine.startsWith('>')) {
          const quoteContent = trimmedLine.replace(/^>\s?/, '');
          if (currentBlock && currentBlock.type === 'quote') {
            currentBlock.content += '\n' + quoteContent;
          } else {
            if (currentBlock) {
              blocks.push(currentBlock);
            }
            currentBlock = {
              type: 'quote',
              content: quoteContent,
            };
          }
          return;
        }
  
        // Handle lists
        const listMatch = this.detectListType(line);
        if (listMatch) {
          if (currentBlock && currentBlock.type !== 'list') {
            blocks.push(currentBlock);
            currentBlock = null;
          }
  
          const listItemContent = line.replace(listMatch.pattern, '').trim();
          blocks.push({
            type: 'list',
            content: listItemContent,
            metadata: {
              listType: listMatch.type,
              listIndex: listMatch.type === 'numbered' ? parseInt(listMatch.index || '1', 10) : undefined,
            },
          });
          return;
        }
  
        // Handle headings
        const headingAnalysis = this.analyzeHeading(trimmedLine, lines, index);
  
        if (headingAnalysis.isHeading) {
          if (currentBlock) {
            blocks.push(currentBlock);
          }
  
          // Create heading block
          blocks.push({
            type: 'heading',
            content: headingAnalysis.headingText,
            metadata: { level: headingAnalysis.level },
          });
  
          // Create paragraph block for remaining content if it exists
          if (headingAnalysis.remainingContent) {
            currentBlock = {
              type: 'paragraph',
              content: headingAnalysis.remainingContent,
            };
          } else {
            currentBlock = null;
          }
        } else {
          // Handle regular paragraphs
          if (!currentBlock) {
            currentBlock = {
              type: 'paragraph',
              content: trimmedLine,
            };
          } else if (currentBlock.type === 'paragraph') {
            currentBlock.content += ' ' + trimmedLine;
          } else {
            blocks.push(currentBlock);
            currentBlock = {
              type: 'paragraph',
              content: trimmedLine,
            };
          }
        }
      });
  
      if (currentBlock) {
        blocks.push(currentBlock);
      }
  
      return blocks;
    }
  
    private analyzeHeading(line: string, lines: string[], index: number): {
      isHeading: boolean;
      headingText: string;
      remainingContent: string;
      level?: number;
    } {
      const words = line.split(/\s+/);
      const firstWord = words[0];
  
      // Check for ATX-style headings (e.g., # Heading)
      const atxMatch = line.match(/^(#{1,6})\s+(.*)/);
      if (atxMatch) {
        return {
          isHeading: true,
          headingText: atxMatch[2].trim(),
          remainingContent: '',
          level: atxMatch[1].length,
        };
      }
  
      // Check for Setext-style headings (underlines)
      if (index < lines.length - 1) {
        const nextLine = lines[index + 1];
        if (/^===+$/.test(nextLine)) {
          return {
            isHeading: true,
            headingText: line.trim(),
            remainingContent: '',
            level: 1,
          };
        } else if (/^---+$/.test(nextLine)) {
          return {
            isHeading: true,
            headingText: line.trim(),
            remainingContent: '',
            level: 2,
          };
        }
      }
  
      // Check for pattern-based headings
      for (const [pattern, level] of this.metadataPatterns.entries()) {
        if (pattern.test(line)) {
          return {
            isHeading: true,
            headingText: line.trim(),
            remainingContent: '',
            level,
          };
        }
      }
  
      // Check if line is in Title Case and not too long
      if (this.isTitleCase(line) && line.length < 60) {
        return {
          isHeading: true,
          headingText: line.trim(),
          remainingContent: '',
          level: 2,
        };
      }
  
      return {
        isHeading: false,
        headingText: '',
        remainingContent: line,
      };
    }
  
    private isTitleCase(line: string): boolean {
      const words = line.split(' ');
      const titleCaseWords = words.filter(
        (word) => /^[A-Z][a-z]/.test(word) || /^[A-Z]+$/.test(word)
      );
      return titleCaseWords.length / words.length > 0.6;
    }
  
    private detectListType(line: string): { type: 'bullet' | 'numbered'; pattern: RegExp; index?: string } | null {
      for (const pattern of this.listPatterns) {
        const match = line.match(pattern);
        if (match) {
          return {
            type: /^\s*\d+[\.)]/.test(line) ? 'numbered' : 'bullet',
            pattern,
            index: match[1],
          };
        }
      }
      return null;
    }
  
    private blocksToMarkdown(blocks: Block[]): string {
      let markdown = '';
      let listType: 'bullet' | 'numbered' | null = null;
      let listStarted = false;
  
      blocks.forEach((block) => {
        switch (block.type) {
          case 'heading':
            markdown += `${'#'.repeat(block.metadata?.level || 1)} ${block.content}\n\n`;
            break;
          case 'paragraph':
            markdown += `${block.content}\n\n`;
            break;
          case 'list':
            if (!listStarted || listType !== block.metadata?.listType) {
              listType = block.metadata?.listType || 'bullet';
              listStarted = true;
            }
            const prefix =
              listType === 'numbered' && block.metadata?.listIndex
                ? `${block.metadata.listIndex}. `
                : '- ';
            markdown += `${prefix}${block.content}\n`;
            break;
          case 'code':
            markdown += `\`\`\`\n${block.content}\`\`\`\n\n`;
            break;
          case 'quote':
            markdown += `> ${block.content}\n\n`;
            break;
        }
      });
  
      return markdown.trim();
    }
  
    public transform(text: string): string {
      const blocks = this.analyzeTextStructure(text);
      return this.blocksToMarkdown(blocks);
    }
  }
  
  export const transformToMarkdown = (text: string): string => {
    return MarkdownTransformer.getInstance().transform(text);
  };
  