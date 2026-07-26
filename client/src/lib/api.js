import axios from "axios";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

const API = axios.create({
  baseURL: `${API_BASE}/api`,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;

export const authAPI = {
  googleLogin: () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  },
  me: () => API.get("/auth/me"),
};

export const adminAPI = {
  dashboard: () => API.get("/admin/dashboard"),
  uploadUsers: (formData) => API.post("/admin/upload-users", formData),
};

export const coordinatorAPI = {
  dashboard: () => API.get("/coordinator/dashboard"),
};

export const mentorAPI = {
  dashboard: () => API.get("/mentor/dashboard"),
  addMentee: (data) => API.post("/mentorship/add", data),
  createInteraction: (data) => API.post("/sessions", data),
};

export const menteeAPI = {
  dashboard: () => API.get("/mentee/dashboard"),
};

export const feedbackAPI = {
  submit: (data) => API.post("/feedback", data),
};

export { API, API_BASE };
