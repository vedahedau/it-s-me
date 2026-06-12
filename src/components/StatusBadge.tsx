import { MessageCircle, Wifi, WifiOff, Loader2 } from "lucide-react";

type ChatStatus = "idle" | "waiting" | "connected" | "disconnected";

interface StatusBadgeProps {
  status: ChatStatus;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = {
    idle: { icon: MessageCircle, label: "Ready to chat", color: "text-muted-foreground", dot: "bg-muted-foreground" },
    waiting: { icon: Loader2, label: "Looking for stranger...", color: "text-status-waiting", dot: "bg-status-waiting" },
    connected: { icon: Wifi, label: "Stranger connected", color: "text-status-connected", dot: "bg-status-connected" },
    disconnected: { icon: WifiOff, label: "Stranger disconnected", color: "text-status-disconnected", dot: "bg-status-disconnected" },
  };

  const { icon: Icon, label, color, dot } = config[status];

  return (
    <div className={`flex items-center gap-2 text-sm ${color}`}>
      <span className={`w-2 h-2 rounded-full ${dot} ${status === "waiting" ? "animate-pulse" : ""}`} />
      <Icon className={`w-4 h-4 ${status === "waiting" ? "animate-spin" : ""}`} />
      <span className="font-medium">{label}</span>
    </div>
  );
};

export default StatusBadge;
