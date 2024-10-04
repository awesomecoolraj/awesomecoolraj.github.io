import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { URL } from 'url';

function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

async function summarizeContent(url: string, content: string, model: string): Promise<ReadableStream> {
  const summaryPrompt = `Summarize the following content from ${url} in exactly 8 sentences:\n\n${content}`;
  const response = await fetch("http://localhost:11434/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: summaryPrompt }],
      stream: true
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API responded with status: ${response.status}`);
  }

  return response.body!;
}

export async function POST(request: Request) {
  const { urls, isChatMode, context, scrapedContent, model = "llama3.2", initialMessage } = await request.json()

  if (!isChatMode) {
    const browser = await puppeteer.launch({ headless: true });
    
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    (async () => {
      for (const url of urls) {
        const fullUrl = url.startsWith('http') ? url : `https://${url}`
        if (!isValidUrl(fullUrl)) {
          writer.write(encoder.encode(JSON.stringify({ 
            url: fullUrl, 
            title: "Error",
            content: `Invalid URL: ${fullUrl}`,
            type: 'error'
          }) + '\n'));
          continue;
        }
        const page = await browser.newPage();
        try {
          await page.goto(fullUrl, { waitUntil: 'networkidle0', timeout: 60000 });
          const text = await page.evaluate(() => document.body.innerText);
          const title = await page.title();
          
          writer.write(encoder.encode(JSON.stringify({ url: fullUrl, title, type: 'start' }) + '\n'));

          const summaryStream = await summarizeContent(fullUrl, text, model);
          const reader = summaryStream.getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonData = line.slice(5).trim();
                if (jsonData === '[DONE]') continue;
                try {
                  const parsedData = JSON.parse(jsonData);
                  if (parsedData.choices && parsedData.choices[0].delta.content) {
                    writer.write(encoder.encode(JSON.stringify({ 
                      url: fullUrl, 
                      content: parsedData.choices[0].delta.content, 
                      type: 'content' 
                    }) + '\n'));
                  }
                } catch (error) {
                  console.error('Error parsing JSON:', error);
                }
              }
            }
          }

          writer.write(encoder.encode(JSON.stringify({ url: fullUrl, type: 'end' }) + '\n'));
        } catch (error) {
          console.error(`Error scraping ${fullUrl}:`, error);
          writer.write(encoder.encode(JSON.stringify({ 
            url: fullUrl, 
            title: "Error",
            content: `Failed to scrape this website: ${error instanceof Error ? error.message : String(error)}`,
            type: 'error'
          }) + '\n'));
        } finally {
          await page.close();
        }
      }

      await browser.close();
      writer.close();
    })();

    return new Response(stream.readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  } else {
    // Chat mode
    const prompt = `You are an AI assistant that helps users understand web content. Use the following scraped content and conversation history to answer the user's question.

Scraped content:
${scrapedContent}

Previous conversation:
${context.map(m => `${m.type}: ${m.content}`).join('\n')}

User's latest message: ${context[context.length - 1].content}

Please provide a response based on this context and the conversation history.`;

    const response = await fetch("http://localhost:11434/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        stream: true
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API responded with status: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}