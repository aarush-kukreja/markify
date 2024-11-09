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

    return NextResponse.json({ 
      markdown: chatCompletion.choices[0].message.content 
    });
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