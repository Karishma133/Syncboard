import { io } from "socket.io-client";
import { API_URL } from "./api";

// single shared socket connection for the whole app, matches backend
// utils/socket.js (joinBoard / leaveBoard rooms, per-board event broadcasts)
let socket;

export function getSocket() {
  if (!socket) {
    socket = io(API_URL, {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}
