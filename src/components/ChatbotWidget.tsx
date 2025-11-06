import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: "assistant", content: "👋 Bonjour ! Posez-moi vos questions sur iPAYX Protocol V4 : tarifs (0.7%), démo, sandbox API, corridors, économies. | Hi! Ask me about iPAYX Protocol V4: pricing (0.7%), demo, sandbox API, corridors, savings." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper to check for CAD payment in message and trigger FINTRAC compliance if needed
  const checkFintracCompliance = async (messageContent: string) => {
    // Simple pattern matching for CAD amounts (e.g., "15000 CAD", "$15,000 CAD", "CAD 15000")
    const cadPattern = /(?:CAD\s*)?[$]?\s*([\d,]+(?:\.\d{2})?)\s*(?:CAD)?/gi;
    const matches = messageContent.match(cadPattern);
    
    if (!matches) return;
    
    // Extract numeric amount
    const amountMatch = matches[0].match(/[\d,]+(?:\.\d{2})?/);
    if (!amountMatch) return;
    
    const amountStr = amountMatch[0].replace(/,/g, '');
    const amount = parseFloat(amountStr);
    
    // Check if message indicates CAD currency and amount >= 10,000
    const isCad = /CAD/i.test(messageContent);
    if (!isCad || amount < 10000) return;
    
    try {
      console.log(`[FINTRAC] Detected CAD payment of ${amount}, checking compliance...`);
      
      const { data, error } = await supabase.functions.invoke('fintrac-compliance', {
        body: {
          senderId: 'CHAT_USER',
          amountCad: amount,
          receiverCountry: 'CA',
          kyc: {
            sender_name: 'Chat User',
            address: 'Provided via Chat',
            dob: '1990-01-01'
          }
        }
      });
      
      if (error) throw error;
      
      if (data.generated) {
        console.log(`[FINTRAC] ECTR generated → ${data.file.path}`);
        const previewLines = data.xmlPreview.split('\n').slice(0, 5).join('\n');
        console.log(`Preview (first 5 lines):\n${previewLines}`);
      } else if (data.reason === 'below_threshold') {
        console.log(`[FINTRAC] Amount below threshold: ${data.amountCad} CAD`);
      }
    } catch (e) {
      console.error('[FINTRAC] Compliance check error:', e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    const userInput = input;
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chatbot", {
        body: { messages: [...messages, userMsg] }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      
      // Check FINTRAC compliance after successful message
      await checkFintracCompliance(userInput);
    } catch (e) {
      console.error(e);
      toast.error("Chatbot error", { description: "Please try again" });
    } finally {
      setLoading(false);
    }
  };

  const parseMessageContent = (content: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: (string | { type: "link"; text: string; url: string })[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      parts.push({ type: "link", text: match[1], url: match[2] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [content];
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_30px_rgba(0,184,212,0.6)] hover:shadow-[0_0_40px_rgba(0,184,212,0.8)] z-50"
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-8 right-8 w-96 h-[500px] bg-card/95 backdrop-blur-xl border-cyan-500/30 shadow-[0_0_40px_rgba(0,184,212,0.3)] flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-cyan-500/20">
            <h3 className="font-bold text-cyan-400">iPAYX Protocol V4 Assistant</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === "user" 
                    ? "bg-cyan-500/20 text-foreground" 
                    : "bg-card/80 border border-cyan-500/20 text-muted-foreground"
                }`}>
                  {parseMessageContent(msg.content).map((part, idx) => {
                    if (typeof part === "string") {
                      return <span key={idx}>{part}</span>;
                    }
                    return (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="ml-2 border-cyan-500/40 hover:border-cyan-500/60"
                        onClick={() => window.open(part.url, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {part.text}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card/80 border border-cyan-500/20 p-3 rounded-lg">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-cyan-500/20">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about pricing, demo..."
                className="flex-1 bg-background/50 border-cyan-500/20"
              />
              <Button onClick={sendMessage} disabled={loading} className="bg-cyan-500 hover:bg-cyan-600">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="border-t border-cyan-500/20 p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
            <Button 
              onClick={() => window.location.href = '/quote'}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
            >
              Get Live Quote Now →
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
