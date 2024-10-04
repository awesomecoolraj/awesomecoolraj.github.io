import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { url } = await req.json();

  try {
    // Fetch the content of the URL
    const response = await fetch(url);
    const html = await response.text();

    // Extract text content from HTML (this is a simple example, you might want to use a proper HTML parser)
    const textContent = html.replace(/<[^>]*>/g, "").trim();

    // Prepare the prompt for the Ollama API
    const prompt = `Summarize the following web page content in a concise manner:\n\n${textContent}`;

    // Make a request to the Ollama API
    const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama2",
        prompt: prompt,
        stream: false,
      }),
    });

    const ollamaData = await ollamaResponse.json();
    const summary = ollamaData.response;

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}