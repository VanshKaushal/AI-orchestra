
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000";
export { WS_BASE_URL };

type EventHandler = (payload: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private currentUrl: string | null = null;
  private handlers: Record<string, EventHandler[]> = {};

  public connect(url: string = WS_BASE_URL) {
    if (this.ws && this.currentUrl === url && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    if (typeof window === "undefined") return;

    // Close existing if URL changed
    if (this.ws) {
      this.ws.close();
    }

    this.currentUrl = url;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data);
        const eventType = data.type || data.event || "message"; // Default to 'message' if raw
        const payload = data.data || data.payload || data;
        
        console.log(`[WS] Event: ${eventType}`, payload);

        if (this.handlers[eventType]) {
          this.handlers[eventType].forEach(handler => handler(payload));
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err, message.data);
      }
    };

    this.ws.onopen = () => {
      console.log("WebSocket connected to", url);
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected from", url);
      // Reconnect logic will be handled by the hook to ensure it uses the latest URL
    };
  }

  public on(event: string, handler: EventHandler) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }

  public off(event: string, handler: EventHandler) {
    if (!this.handlers[event]) return;
    this.handlers[event] = this.handlers[event].filter(h => h !== handler);
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.currentUrl = null;
    }
  }

  public isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}


export const wsService = new WebSocketService();
