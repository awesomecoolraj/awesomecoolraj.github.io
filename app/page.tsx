"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, Zap, Settings, BarChart, ArrowDown, Send, ListPlus, ArrowLeft } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

type Message = {
  type: 'user' | 'bot';
  content: string;
}

type Chat = {
  id: string;
  name: string;
  urls: string[];
  messages: Message[];
}

export default function Home() {
  const [urls, setUrls] = useState("")
  const [initialMessage, setInitialMessage] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [summaries, setSummaries] = useState<{[key: string]: string}>({})

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urls.trim()) {
      alert("Please enter at least one valid URL.")
      return
    }

    setIsLoading(true)
    setError(null)
    setSummaries({})
    const urlList = urls.split('\n').map(u => u.trim()).filter(u => u)
    
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlList, initialMessage }),
      });
      
      if (response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.trim() !== '') {
              try {
                const data = JSON.parse(line);
                if (data.type === 'content') {
                  setSummaries(prev => ({
                    ...prev,
                    [data.url]: (prev[data.url] || '') + data.content
                  }));
                }
              } catch (error) {
                console.error('Error parsing JSON:', error);
              }
            }
          }
        }

        const newChat: Chat = {
          id: Date.now().toString(),
          name: `Chat about ${urlList[0]}`,
          urls: urlList,
          messages: [
            { type: 'user', content: `${urlList.join(', ')}${initialMessage ? ' | ' + initialMessage : ''}` },
            ...Object.entries(summaries).map(([url, summary]) => ({
              type: 'bot' as const,
              content: `Summary for ${url}:\n\n${summary}`
            }))
          ]
        };

        setChats(prev => [...prev, newChat]);
        setCurrentChat(newChat);
      } else {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(`An error occurred while fetching the data: ${error.message}`);
      } else {
        setError('An unknown error occurred while fetching the data');
      }
    } finally {
      setIsLoading(false);
      setUrls("");
      setInitialMessage("");
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !currentChat) return;

    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, { type: 'user' as const, content: message }]
    };
    setCurrentChat(updatedChat);
    setChats(prevChats => prevChats.map(chat => chat.id === updatedChat.id ? updatedChat : chat));
    setMessage("");

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          isChatMode: true, 
          context: updatedChat.messages,
          scrapedContent: Object.values(summaries).join('\n\n')
        }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let botResponse = "";

        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonData = line.slice(5).trim();
              if (jsonData === '[DONE]') continue;
              try {
                const parsedData = JSON.parse(jsonData);
                if (parsedData.choices && parsedData.choices[0].delta.content) {
                  botResponse += parsedData.choices[0].delta.content;
                  setCurrentChat(prev => ({
                    ...prev!,
                    messages: [
                      ...prev!.messages.slice(0, -1),
                      { type: 'bot', content: botResponse }
                    ]
                  }));
                }
              } catch (error) {
                console.error('Error parsing JSON:', error);
              }
            }
          }
        }

        setChats(chats.map(chat => 
          chat.id === updatedChat.id 
            ? { ...chat, messages: [...chat.messages, { type: 'bot', content: botResponse }] }
            : chat
        ));
      } else {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(`An error occurred while sending the message: ${error.message}`);
      } else {
        setError('An unknown error occurred while sending the message');
      }
    }
  }

  const handleUseTestUrls = () => {
    setUrls("https://www.bbc.com/news\nhttps://www.nasa.gov\nhttps://www.nationalgeographic.com");
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-700 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-black bg-opacity-30 p-4 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6 gradient-text">AI Web Scraper</h1>
        <Button onClick={() => setCurrentChat(null)} variant="ghost" className="w-full justify-start mb-4">
          <ListPlus className="mr-2 h-5 w-5" /> New Chat
        </Button>
        <div className="space-y-2">
          {chats.map((chat) => (
            <Button 
              key={chat.id} 
              variant="ghost" 
              className="w-full justify-start text-left truncate"
              onClick={() => setCurrentChat(chat)}
            >
              <ChevronRight className="mr-2 h-5 w-5" /> {chat.name}
            </Button>
          ))}
        </div>
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="mr-2 h-5 w-5" /> Settings
          </Button>
          <Link href="/upgrade">
            <Button variant="outline" className="w-full justify-start bg-gradient-to-r from-pink-500 to-violet-500 text-white border-none">
              <Zap className="mr-2 h-5 w-5" /> Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* URL Input and Summaries */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <form onSubmit={handleScrape} className="space-y-2">
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="Enter URLs to scrape (one per line)"
              className="w-full h-32 p-2 text-black rounded-md"
            />
            <Input
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Optional: Enter initial message"
              className="w-full"
            />
            <div className="flex space-x-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <ArrowDown className="mr-2 h-5 w-5 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Scrape
                  </>
                )}
              </Button>
              <Button type="button" onClick={handleUseTestUrls} className="flex-1">
                Use Test URLs
              </Button>
            </div>
          </form>

          {Object.entries(summaries).map(([url, summary]) => (
            <Card key={url} className="bg-black bg-opacity-30">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">{url}</h3>
                <ReactMarkdown>{summary}</ReactMarkdown>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chat Interface */}
        {currentChat && (
          <div className="h-1/2 flex flex-col bg-black bg-opacity-30 p-4">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {currentChat.messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-3/4 p-2 rounded-lg ${message.type === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit">Send</Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}