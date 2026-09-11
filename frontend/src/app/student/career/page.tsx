"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Sparkles, Compass } from "lucide-react"
import ReactMarkdown from "react-markdown"

export default function CareerNavigatorPage() {
  const [query, setQuery] = useState("")
  const [response, setResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const quickPrompts = [
    "Frontend vs Backend: Which is better for beginners?",
    "What is the best roadmap to learn Data Science in 2026?",
    "Should I learn Python or Node.js first?"
  ]

  const handleAsk = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setResponse(null);
    setQuery(text);

    try {
      const res = await fetch('/api/career-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text })
      });
      
      const data = await res.json();
      if (data.text) {
        setResponse(data.text);
      } else {
        setResponse("Sorry, I encountered an error while thinking. Please try again.");
      }
    } catch {
      setResponse("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <div className="text-center space-y-3 pt-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm mb-4">
          <Compass className="h-6 w-6"/>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Career Advisor</h1>
        <p className="text-slate-500">Ask any question about courses, tech stacks, or career paths.</p>
      </div>

      {/* Input Section */}
      <Card className="border border-slate-200/80 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardContent className="p-2 flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk(query)}
            placeholder="E.g., Which certification is best for cloud computing?"
            className="flex-1 h-12 px-4 bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 outline-none"
            disabled={isLoading}
          />
          <Button 
            onClick={() => handleAsk(query)} 
            disabled={isLoading || !query.trim()}
            className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            {isLoading ? <Sparkles className="h-4 w-4 animate-pulse"/> : <Send className="h-4 w-4"/>}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Prompts (Only show if no response yet) */}
      {!response && !isLoading && (
        <div className="flex flex-wrap justify-center gap-2 pt-4">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(prompt)}
              className="px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Response Display Section */}
      {isLoading && (
        <div className="p-8 text-center animate-pulse">
          <div className="h-8 w-8 mx-auto border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 mt-4 font-medium">Analyzing career paths...</p>
        </div>
      )}

      {response && !isLoading && (
        <Card className="border border-emerald-100 bg-white shadow-sm rounded-3xl overflow-hidden mt-8 animate-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-6 sm:p-8 prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-600 prose-a:text-emerald-600 prose-li:text-slate-600">
            <ReactMarkdown>{response}</ReactMarkdown>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
