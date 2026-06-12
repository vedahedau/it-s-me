import { useState, useCallback, useRef, useEffect } from "react";
import { socket } from "@/lib/socket";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "you" | "stranger" | "system";
  timestamp: Date;
}

type ChatStatus = "idle" | "waiting" | "connected" | "disconnected";

export function useAnonymousChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [isStrangerTyping, setIsStrangerTyping] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addMessage = useCallback((text: string, sender: ChatMessage["sender"]) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, text, sender, timestamp: new Date() },
    ]);
  }, []);

  const startSearching = useCallback(() => {
    setMessages([]);
    setStatus("waiting");
    setIsStrangerTyping(false);
    addMessage("Looking for a stranger to chat with...", "system");

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("start-chat");
  }, [addMessage]);

  const sendMessage = useCallback(
    (text: string) => {
      if (status !== "connected" || !text.trim()) return;

      socket.emit("send-message", text.trim());
      addMessage(text.trim(), "you");
    },
    [status, addMessage]
  );

  const sendTyping = useCallback(() => {
    if (status !== "connected") return;
    socket.emit("typing-start");
  }, [status]);

  const stopTyping = useCallback(() => {
    if (status !== "connected") return;
    socket.emit("typing-stop");
  }, [status]);

  const nextStranger = useCallback(() => {
    socket.emit("next-stranger");
    setStatus("waiting");
    setIsStrangerTyping(false);
    addMessage("Looking for a new stranger...", "system");
  }, [addMessage]);

  const disconnect = useCallback(() => {
    socket.disconnect();
    setStatus("idle");
    setMessages([]);
    setIsStrangerTyping(false);
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    const handleStatusUpdate = (newStatus: ChatStatus) => {
      setStatus(newStatus);
      if (newStatus === "connected") {
        addMessage("You are now connected with a stranger. Say hi! 👋", "system");
      } else if (newStatus === "disconnected") {
        addMessage("Stranger has disconnected.", "system");
        setIsStrangerTyping(false);
      }
    };

    const handleReceiveMessage = (message: string) => {
      addMessage(message, "stranger");
      setIsStrangerTyping(false);
    };

    const handleStrangerTyping = () => {
      setIsStrangerTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsStrangerTyping(false), 2000);
    };

    const handleStrangerStopTyping = () => {
      setIsStrangerTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    socket.on("status-update", handleStatusUpdate);
    socket.on("receive-message", handleReceiveMessage);
    socket.on("stranger-typing", handleStrangerTyping);
    socket.on("stranger-stop-typing", handleStrangerStopTyping);

    return () => {
      socket.off("status-update", handleStatusUpdate);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("stranger-typing", handleStrangerTyping);
      socket.off("stranger-stop-typing", handleStrangerStopTyping);
    };
  }, [addMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return {
    messages,
    status,
    isStrangerTyping,
    startSearching,
    sendMessage,
    sendTyping,
    stopTyping,
    nextStranger,
    disconnect,
  };
}
