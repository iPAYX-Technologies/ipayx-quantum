import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Code, Send, X, ExternalLink, TrendingUp, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Logo from "@/components/Logo";

type AgentType = "marketing" | "it";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Agents() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openAgent = (type: AgentType) => {
    setSelectedAgent(type);
    setMessages([
      {
        role: "assistant",
        content: type === "marketing"
          ? "👋 Hi! I'm your AI Marketing Advisor. Ask me about pricing (0.7%), ROI calculations, cost comparisons, or compliance. How can I help optimize your payment costs?"
          : "👋 Hi! I'm your AI Technical Advisor. Ask me about API integration, code examples, architecture, or troubleshooting. What technical challenge can I help with?"
      }
    ]);
  };

  const closeAgent = () => {
    setSelectedAgent(null);
    setMessages([]);
    setInput("");
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedAgent) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const functionName = selectedAgent === "marketing" ? "ai-marketing" : "ai-it";
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { messages: [...messages, userMsg] }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) {
      console.error(e);
      toast.error("Agent error", { description: "Please try again" });
    } finally {
      setLoading(false);
    }
  };

  const parseMessageContent = (content: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: any[] = [];
    let lastIndex = 0;

    // Parse code blocks first
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index);
        // Parse links in text before code block
        parts.push(...parseTextWithLinks(textBefore));
      }
      parts.push({ type: "code", language: match[1] || "typescript", code: match[2].trim() });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(...parseTextWithLinks(content.slice(lastIndex)));
    }

    return parts.length > 0 ? parts : [content];
  };

  const parseTextWithLinks = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: any[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push({ type: "link", text: match[1], url: match[2] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-12">
          <Logo className="h-24 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            🤖 AI Agent Command Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Specialized AI agents powered by iPAYX Protocol V4. Get instant answers from our Marketing and Technical experts.
          </p>
        </div>

        {/* Agent Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Marketing Agent */}
          <Card className="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 hover:border-cyan-500/50 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] cursor-pointer group"
                onClick={() => openAgent("marketing")}>
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-foreground">AI Marketing Agent</h3>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Online</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Expert in pricing, ROI calculations, cost comparisons, and compliance. Tailored for CFOs, Finance Directors, and Treasury Leads.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">Pricing (0.7%)</Badge>
                  <Badge variant="outline" className="text-xs">ROI Calculator</Badge>
                  <Badge variant="outline" className="text-xs">Cost Savings</Badge>
                  <Badge variant="outline" className="text-xs">Compliance</Badge>
                </div>
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Chat with Marketing Agent
                </Button>
              </div>
            </div>
          </Card>

          {/* IT Agent */}
          <Card className="p-8 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:border-blue-500/50 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] cursor-pointer group"
                onClick={() => openAgent("it")}>
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Code className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-foreground">AI Technical Agent</h3>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Online</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Expert in API integration, code examples, architecture, and troubleshooting. Built for CTOs, Developers, and DevOps Engineers.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">API Integration</Badge>
                  <Badge variant="outline" className="text-xs">Code Snippets</Badge>
                  <Badge variant="outline" className="text-xs">Architecture</Badge>
                  <Badge variant="outline" className="text-xs">Debugging</Badge>
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                  <Wrench className="h-4 w-4 mr-2" />
                  Chat with Technical Agent
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Features */}
        <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
          <h2 className="text-2xl font-bold mb-6 text-center">What Our AI Agents Can Do</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Instant Answers</h3>
              <p className="text-sm text-muted-foreground">
                Get immediate responses to pricing, integration, or technical questions 24/7.
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                <Code className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="font-semibold mb-2">Code Examples</h3>
              <p className="text-sm text-muted-foreground">
                Receive working TypeScript/JavaScript code snippets for quick integration.
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="font-semibold mb-2">ROI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Calculate exact savings based on your transaction volume and corridors.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chat Dialog */}
      <Dialog open={selectedAgent !== null} onOpenChange={(open) => !open && closeAgent()}>
        <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0 gap-0 bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader className="p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  selectedAgent === "marketing" 
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600" 
                    : "bg-gradient-to-br from-blue-500 to-cyan-600"
                }`}>
                  {selectedAgent === "marketing" ? <TrendingUp className="h-5 w-5 text-white" /> : <Code className="h-5 w-5 text-white" />}
                </div>
                <div>
                  <DialogTitle>
                    {selectedAgent === "marketing" ? "AI Marketing Agent" : "AI Technical Agent"}
                  </DialogTitle>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Online</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={closeAgent}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-4 rounded-lg ${
                  msg.role === "user"
                    ? "bg-primary/20 text-foreground"
                    : "bg-card/80 border border-border/50 text-muted-foreground"
                }`}>
                  {parseMessageContent(msg.content).map((part, idx) => {
                    if (typeof part === "string") {
                      return <span key={idx} className="whitespace-pre-wrap">{part}</span>;
                    }
                    if (part.type === "link") {
                      return (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="ml-2 border-primary/40 hover:border-primary/60"
                          onClick={() => {
                            if (part.url.startsWith("/")) {
                              closeAgent();
                              window.location.href = part.url;
                            } else {
                              window.open(part.url, "_blank");
                            }
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {part.text}
                        </Button>
                      );
                    }
                    if (part.type === "code") {
                      return (
                        <pre key={idx} className="mt-2 p-3 bg-black/50 rounded-lg overflow-x-auto">
                          <code className="text-xs text-green-400">{part.code}</code>
                        </pre>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card/80 border border-border/50 p-4 rounded-lg">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-border/50">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder={selectedAgent === "marketing" ? "Ask about pricing, ROI, savings..." : "Ask about API, integration, code..."}
                className="flex-1 bg-background/50 border-border/50"
              />
              <Button 
                onClick={sendMessage} 
                disabled={loading}
                className={selectedAgent === "marketing" 
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  : "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                }
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
