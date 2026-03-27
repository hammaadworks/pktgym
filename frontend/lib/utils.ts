import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSocketUrl() {
  // Returning "/" tells Socket.io to use the current domain and protocol (https/ngrok).
  // Our Next.js rewrite in next.config.ts will then catch this and forward it to port 3001.
  return "/";
}