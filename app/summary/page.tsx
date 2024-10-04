"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Download, Copy, Share2 } from "lucide-react"
import Link from "next/link"

export default function Summary() {
  const [activeTab, setActiveTab] = useState("summary")

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-black/30 backdrop-blur-md text-white border-none shadow-2xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">AI Analysis Results</h1>
            <Button variant="outline" className="text-white border-white/30 hover:bg-white/20" asChild>
              <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Scraper</Link>
            </Button>
          </div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Scraping Progress</h2>
            <Progress value={66} className="w-full h-2" />
            <p className="text-sm text-white/70 mt-2">Processing: example.com (66%)</p>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/10">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="data">Raw Data</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="mt-4">
              <div className="bg-white/10 p-4 rounded-lg min-h-[300px] mb-4 overflow-auto">
                <p className="text-white/90">
                  This is where the AI-generated summary will be displayed. The content will be populated after the web
                  scraping and summarization process is complete. It will provide a concise overview of the scraped website's
                  main points and key information.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="insights" className="mt-4">
              {/* AI-generated insights content */}
            </TabsContent>
            <TabsContent value="data" className="mt-4">
              {/* Raw scraped data content */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <div className="mt-8 flex space-x-4">
        <Button variant="outline" className="text-white border-white/30 hover:bg-white/20">
          <Copy className="w-4 h-4 mr-2" /> Copy to Clipboard
        </Button>
        <Button variant="outline" className="text-white border-white/30 hover:bg-white/20">
          <Share2 className="w-4 h-4 mr-2" /> Share Results
        </Button>
        <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
          <Download className="w-4 h-4 mr-2" /> Download Report
        </Button>
      </div>
    </div>
  )
}