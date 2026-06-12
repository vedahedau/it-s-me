import { io } from "socket.io-client";

const socketHost = window.location.hostname;

export const socket = io(`http://${socketHost}:3001`, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});