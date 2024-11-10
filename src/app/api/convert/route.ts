import { Groq } from "groq-sdk";
import { NextResponse } from "next/server";

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not set in environment variables');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' }, 
        { status: 400 }
      );
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Return inputs in markdown, only the markdown, nothing else. No comments, no explanations, no nothing.`
        },
        {
          role: "user",
          content: text
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.1,
      max_tokens: 8192,
      top_p: 1,
      stream: false
    });

    if (!chatCompletion.choices?.[0]?.message?.content) {
      throw new Error('No response from Groq API');
    }

    let markdown = chatCompletion.choices[0].message.content;

    // Final validation and correction step
    const validateAndCorrect = (original: string, formatted: string): string => {
      // Split both texts into paragraphs
      const originalParagraphs = original.split(/\n\s*\n/).map(p => p.trim());
      const formattedParagraphs = formatted.split(/\n\s*\n/).map(p => p.trim());
      
      // Extract markdown formatting patterns
      const getMarkdownPatterns = (text: string) => {
        return {
          headers: text.match(/^#{1,6}\s/gm) || [],
          bold: text.match(/\*\*[^*]+\*\*/g) || [],
          italic: text.match(/\*[^*]+\*/g) || [],
          lists: text.match(/^[-*]\s|^\d+\.\s/gm) || [],
        };
      };

      const patterns = getMarkdownPatterns(formatted);
      
      // Process each original paragraph
      const correctedParagraphs = originalParagraphs.map(originalParagraph => {
        // Find if there's a corresponding formatted paragraph
        const formattedParagraph = formattedParagraphs.find(fp => 
          fp.replace(/[#*_`\-\d.]/g, '').trim().includes(
            originalParagraph.replace(/[#*_`\-\d.]/g, '').trim()
          )
        );

        if (formattedParagraph) {
          return formattedParagraph;
        } else {
          // If no matching formatted paragraph, apply basic markdown
          let corrected = originalParagraph;
          
          // Apply header if it looks like a header
          if (/^[A-Z].*[:.]\s*$/.test(corrected)) {
            corrected = '## ' + corrected;
          }
          
          // Apply list formatting if it looks like a list item
          if (/^[-•]\s/.test(corrected)) {
            corrected = '* ' + corrected.replace(/^[-•]\s/, '');
          }
          
          return corrected;
        }
      });

      return correctedParagraphs.join('\n\n');
    };

    const finalMarkdown = validateAndCorrect(text, markdown);

    return NextResponse.json({ markdown: finalMarkdown });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Failed to process text',
      details: error?.toString()
    }, { 
      status: 500 
    });
  }
} 