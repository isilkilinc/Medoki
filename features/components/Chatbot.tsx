import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { chatWithMedoki, ChatMessage } from "@/lib/groq";
import { useAuth } from "@/contexts/AuthContext";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Merhaba${user?.user_metadata?.first_name ? ` ${user.user_metadata.first_name}` : ""}! Ben Medoki. İlaçlar, yan etkiler veya sağlıkla ilgili merak ettiğiniz bir şey varsa sormaktan çekinmeyin.`
        }
      ]);
    }
    scrollToBottom();
  }, [isOpen, messages.length, user]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMessage }
    ];
    setMessages(newMessages);
    setIsLoading(true);
    scrollToBottom();

    try {
      const response = await chatWithMedoki(newMessages, userMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response }
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Bağlantıda bir sorun oluştu. Lütfen tekrar deneyin." }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-[90px] right-4 sm:right-6 z-[90] w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'}`}
        aria-label="Medoki Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed z-[100] bottom-[90px] right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[380px] h-[500px] max-h-[calc(100vh-120px)] bg-card border border-border shadow-2xl rounded-[24px] flex flex-col overflow-hidden transition-all duration-400 ease-out origin-bottom-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-8 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full"></span>
            </div>
            <div>
              <h3 className="font-bold text-foreground text-[15px]">Medoki Asistan</h3>
              <p className="text-[11px] text-emerald-500 font-semibold tracking-wide uppercase mt-0.5">Çevrimiçi</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10 relative">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' 
                    : 'bg-card text-foreground border border-border/50 rounded-2xl rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card text-muted-foreground border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex items-center gap-2 relative z-10">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Bir soru sorun..."
            className="flex-1 bg-muted border border-transparent rounded-full px-4 py-2.5 text-[14px] focus:outline-none focus:bg-background focus:border-primary/30 transition-all placeholder:text-muted-foreground"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 hover:bg-primary/90 transition-all shadow-sm active:scale-95"
          >
            <Send className="w-4 h-4 ml-[-2px]" />
          </button>
        </form>
      </div>
    </>
  );
};

export default Chatbot;
