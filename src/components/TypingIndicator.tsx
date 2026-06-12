const TypingIndicator = () => (
  <div className="flex justify-start mb-2 animate-fade-in-up">
    <div className="bg-chat-stranger rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
      <span className="text-xs text-chat-stranger-foreground mr-1">Stranger is typing</span>
      <span className="w-1.5 h-1.5 rounded-full bg-chat-stranger-foreground/60 typing-dot" />
      <span className="w-1.5 h-1.5 rounded-full bg-chat-stranger-foreground/60 typing-dot" />
      <span className="w-1.5 h-1.5 rounded-full bg-chat-stranger-foreground/60 typing-dot" />
    </div>
  </div>
);

export default TypingIndicator;
