"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, Loader2 } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};


export default function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-10), // last 10 for context
        }),
      });

      const data = await response.json();

      if (data.reply) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.reply,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all z-50 hover:transform hover:translate-y-[-4px]"
          style={{
            background: "linear-gradient(145deg, #2a3f54 0%, #1e2b3a 100%)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
          aria-label="Open AI Tutor"
        >
          <MessageCircle size={24} className="text-white" />
        </button>
      )}

      {/* Sidebar */}
      {isOpen && (
        <div
          className="fixed top-0 right-0 h-full w-full sm:w-96 shadow-2xl z-50 flex flex-col"
          style={{
            background: "linear-gradient(145deg, #2a3f54 0%, #1e2b3a 100%)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="text-white" size={20} />
              <h2 className="text-lg font-semibold text-white" style={{ letterSpacing: "0.5px" }}>
                AI Tutor
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-300 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-300 mt-8">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  Hi! I'm your AI tutor. Ask me anything about your study cards!
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg transition-all ${
                    msg.role === "user"
                      ? "text-white"
                      : "text-white"
                  }`}
                  style={{
                    background:
                      msg.role === "user"
                        ? "linear-gradient(145deg, #3a5a7a 0%, #2a4a6a 100%)"
                        : "rgba(255,255,255,0.1)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-2 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  <Loader2 className="animate-spin text-gray-300" size={20} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="p-4"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 transition-all"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:transform hover:translate-y-[-2px]"
                style={{
                  background: "linear-gradient(145deg, #3a5a7a 0%, #2a4a6a 100%)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
                aria-label="Send message"
              >
                <Send size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
