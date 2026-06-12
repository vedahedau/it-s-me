import { ChatMessage } from "@/hooks/useAnonymous Chat ";

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble = ({ message }: ChatBubbleProps) => {
  if (message.sender === "system") {
    return (
      <div className="flex justify-center my-3 animate-fade-in-up">
        <span className="text-xs text-chat-system bg-secondary/50 px-3 py-1.5 rounded-full font-mono">
          {message.text}
        </span>
      </div>
    );
  }

  const isYou = message.sender === "you";

  return (
    <div className={`flex ${isYou ? "justify-end" : "justify-start"} mb-2 animate-fade-in-up`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
          isYou
            ? "bg-chat-user text-chat-user-foreground rounded-2xl rounded-br-md"
            : "bg-chat-stranger text-chat-stranger-foreground rounded-2xl rounded-bl-md"
        }`}
      >
        <p className="break-words whitespace-pre-wrap">{message.text}</p>
        <p className={`text-[10px] mt-1 ${isYou ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
};

export default ChatBubble;
