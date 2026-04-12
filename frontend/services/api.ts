import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

export const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// TEST FUNCTION
export const testBackend = async () => {
  try {
    const res = await fetch(`${BASE_URL}/`);
    const data = await res.json();
    console.log("✅ BACKEND CONNECTED:", data);
    return data;
  } catch (err) {
    console.error("❌ FETCH FAILED:", err);
    throw err;
  }
};

// REAL APIs
export const createSession = () =>
  API.post("/session/create");

export const getSessions = () =>
  API.get("/sessions");

export const sendMessage = (sessionId: string, message: string) =>
  API.post("/chat", {
    session_id: sessionId,
    message,
  });

export const getState = () =>
  API.get("/state");

export const switchModel = (sessionId: string, model: string) =>
  API.post("/switch", {
    session_id: sessionId,
    model,
  });

export const runCommand = (command: string) =>
  API.post("/command", { command });