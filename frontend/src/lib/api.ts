import axios from 'axios';
import { io } from 'socket.io-client';

/**
 * API base URL — from Vite env (Docker sets VITE_API_URL=http://localhost:3000).
 * Browser code must use the host-published port, not Docker service names.
 */
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL,
});

// Add JWT to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const socket = io(baseURL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export default api;
