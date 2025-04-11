// api.ts
import axios from "axios";

const API_BASE_URL = "http://45.119.47.81:8000";  // Adjust if your FastAPI backend runs on a different port

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Function to set authorization token dynamically
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers["Authorization"] = `Bearer ${token}`;
    console.log("Auth Token Set:", token); // Log the token
  } else {
    delete api.defaults.headers["Authorization"];
    console.log("Auth Token Removed");
  }
};


export default api;