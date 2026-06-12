import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, SkipForward, Square } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import TypingIndicator from "@/components/TypingIndicator";
import { socket } from "@/lib/socket";

type ChatStatus = "idle" | "waiting" | "connected" | "disconnected";

type ChatMessage = {
  sender: "you" | "stranger";
  text: string;
};

const Index = () => {
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);

  const typingTimeoutRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    socket.on("status-update", (newStatus: ChatStatus) => {
      setStatus(newStatus);
    });

    socket.on("receive-message", (message: string) => {
      setMessages((prev) => [...prev, { sender: "stranger", text: message }]);
    });

    socket.on("stranger-typing", () => {
      setIsTyping(true);
    });

    socket.on("stranger-stop-typing", () => {
      setIsTyping(false);
    });

    return () => {
      socket.off("status-update");
      socket.off("receive-message");
      socket.off("stranger-typing");
      socket.off("stranger-stop-typing");
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleStartChat = () => {
    setChatStarted(true);

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("start-chat");
  };

  const handleStopChat = () => {
    setChatStarted(false);
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setStatus("idle");

    if (socket.connected) {
      socket.disconnect();
    }
  };

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (status !== "connected") return;

    socket.emit("send-message", trimmed);
    socket.emit("typing-stop");

    setMessages((prev) => [...prev, { sender: "you", text: trimmed }]);
    setInput("");
  };

  const handleTyping = (value: string) => {
    setInput(value);

    if (status !== "connected") return;

    socket.emit("typing-start");

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit("typing-stop");
    }, 700);
  };

  const handleNext = () => {
    setMessages([]);
    setInput("");
    setIsTyping(false);
    socket.emit("next-stranger");
  };

  if (!chatStarted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="w-full max-w-6xl min-h-[92vh] rounded-3xl border bg-card shadow-xl overflow-hidden">
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>

              <div>
                <h1 className="text-2xl font-bold">Anonymous Chat </h1>
                <StatusBadge status={status} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center min-h-[calc(92vh-81px)] px-6">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto mb-8 shadow-lg">
                <MessageCircle className="w-12 h-12 text-primary" />
              </div>

              <h2 className="text-4xl font-bold mb-4">Talk to Strangers</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                Connect anonymously with random people around the world. No sign-up needed.
              </p>

              <button
                onClick={handleStartChat}
                className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg hover:opacity-90 transition"
              >
                Start Chatting
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-6xl min-h-[92vh] rounded-3xl border bg-card shadow-xl overflow-hidden flex flex-col">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>

            <div>
              <h1 className="text-2xl font-bold">Anonymous Chat </h1>
              <StatusBadge status={status} />
            </div>
          </div>

          <button
            onClick={handleStopChat}
            className="h-12 px-5 rounded-2xl bg-red-500/15 text-red-400 border border-red-500/20 flex items-center gap-2 hover:bg-red-500/20 transition"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 bg-muted/10">
          {messages.length === 0 && status !== "connected" && (
            <div className="h-full flex items-start justify-center pt-8 text-muted-foreground text-sm">
              <div className="px-4 py-2 rounded-full bg-secondary/60">
                {status === "waiting"
                  ? "Looking for a stranger to chat with..."
                  : "Press Start Chatting"}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.sender === "you" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.sender === "you"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  }`}
                >
                  <div className="text-[11px] opacity-70 mb-1">
                    {message.sender === "you" ? "You" : "Stranger"}
                  </div>
                  <div className="text-sm break-words">{message.text}</div>
                </div>
              </div>
            ))}

            {isTyping && <TypingIndicator />}
            <div ref={chatEndRef} />
          </div>
        </div>

        <div className="border-t px-4 py-4 bg-card">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder={
                status === "connected"
                  ? "Type a message..."
                  : "Waiting for stranger..."
              }
              disabled={status !== "connected"}
              className="flex-1 h-12 rounded-full border bg-background px-5 outline-none"
            />

            <button
              onClick={sendMessage}
              disabled={status !== "connected" || !input.trim()}
              className="h-12 w-12 rounded-full bg-primary text-primary-foreground disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>

            <button
              onClick={handleNext}
              className="h-12 px-4 rounded-full border bg-secondary text-secondary-foreground flex items-center gap-2"
            >
              <SkipForward className="w-5 h-5" />
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;