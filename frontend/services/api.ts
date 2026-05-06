export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

console.log("API URL:", BASE_URL);

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    const text = await res.text();

    if (!res.ok) {
      return {
        success: false,
        error: `HTTP ${res.status}: ${text || res.statusText}`,
      };
    }

    if (!text || text.trim() === "") {
      return {
        success: true,
        data: {} as T, // Return empty object if success but no body
      };
    }

    try {
      const json = JSON.parse(text);
      
      // If the server already provided the standard envelope, return it as is
      if (json && typeof json === "object" && "success" in json) {
        return json as ApiResponse<T>;
      }

      // Otherwise, wrap it for backward compatibility and internal standard
      return {
        success: true,
        data: json,
      };
    } catch (e) {
      console.error("JSON Parse Error:", e, "Raw text:", text);
      return {
        success: false,
        error: "Server returned invalid JSON format",
      };
    }
  } catch (err: any) {
    console.error("Fetch Error:", err);
    return {
      success: false,
      error: err.message || "Network request failed. Is the backend running?",
    };
  }
}

// TEST FUNCTION
export async function testBackend() {
  return request<{ status: string }>("/health");
}

// SESSION APIs
export async function createSession() {
  return request<{ session_id: string; task?: string; status?: string; created_at?: string }>("/session/create", {
    method: "POST",
  });
}

export async function getSessions() {
  return request<any[]>("/sessions");
}

// CHAT API
export async function sendMessage(payload: {
  session_id: string;
  message: string;
  provider: string;
}) {
  return request<any>("/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// STATE & COMMAND APIs
export async function getState() {
  return request<any>("/state");
}

export async function switchModel(sessionId: string, model: string) {
  return request<any>("/switch", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, model }),
  });
}

export async function runCommand(command: string) {
  return request<{ output: string }>("/command", {
    method: "POST",
    body: JSON.stringify({ command }),
  });
}

// FILE UPLOAD (Special case, doesn't use JSON body)
export async function uploadFile(formData: FormData): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });
    const text = await res.text();
    if (!res.ok) return { success: false, error: text };
    return { success: true, data: JSON.parse(text) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}