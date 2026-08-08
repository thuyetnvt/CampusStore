import axios from 'axios';

const defaultApiBaseUrl =
  typeof window === 'undefined'
    ? 'http://127.0.0.1:5155/api'
    : `${window.location.protocol}//${window.location.hostname}:5155/api`;

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});
