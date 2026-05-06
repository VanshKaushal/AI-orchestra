"use client";

import { useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { wsService, WS_BASE_URL } from "../services/websocket";
import { sendMessage as apiSendMessage } from "../services/api";
import { useAnalytics } from "../store/useAnalytics";

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}


export function useChat() {
  const { 
    activeSessionId, 
    addMessage, 
    setIsThinking, 
    addWatchdogLog,
    setGlobalState,
    switchModel,
    currentModels
  } = useStore();
  const { logRequest, logError } = useAnalytics();
  const provider = activeSessionId ? currentModels[activeSessionId] : "OpenAI";

  if (!provider) {
    console.warn("Provider missing — using fallback");
  }


  const receivedMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!activeSessionId) return;

    // 1. Connect to session-specific channel
    const sessionUrl = `${WS_BASE_URL}/ws/session/${activeSessionId}`;
    wsService.connect(sessionUrl);

    // 2. Event Handlers
    const handleNewMessage = (payload: any) => {
      const msgData = payload.data || payload;
      if (payload.session_id === activeSessionId || msgData.session_id === activeSessionId) {
        receivedMessageIds.current.add(msgData.id);
        
        addMessage(activeSessionId, {
          id: msgData.id,
          session_id: activeSessionId,
          role: msgData.role === "ai" ? "assistant" : (msgData.role || "assistant"),
          content: msgData.content,
          timestamp: msgData.timestamp || Date.now(),
          modelUsed: msgData.provider
        });
        
        setIsThinking(activeSessionId, false);
      }
    };

    const handleWatchdogLog = (payload: any) => {
      addWatchdogLog({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        message: payload.log,
        type: "info"
      });
    };

    const handleModelSwitch = (payload: any) => {
      if (payload.session_id === activeSessionId) {
        switchModel(payload.session_id, payload.model);
        addMessage(payload.session_id, {
          id: `${Date.now()}-sys`,
          session_id: payload.session_id,
          role: "system",
          content: `[Switched → ${payload.model}]`,
          timestamp: Date.now()
        });
      }
    };

    wsService.on("message", handleNewMessage);
    wsService.on("watchdog_log", handleWatchdogLog);
    wsService.on("model_switched", handleModelSwitch);

    return () => {
      wsService.off("message", handleNewMessage);
      wsService.off("watchdog_log", handleWatchdogLog);
      wsService.off("model_switched", handleModelSwitch);
    };
  }, [activeSessionId, addMessage, addWatchdogLog, setIsThinking, switchModel]);

  const sendMessage = async (content: string) => {
    // 0. Safety Check
    if (!activeSessionId) {
      console.error("No session_id — blocking request");
      return;
    }


    // 1. Optimistic Update (User Message)
    const userMsgId = `u-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      session_id: activeSessionId,
      role: "user" as const,
      content,
      timestamp: Date.now(),
      isSending: true
    };
    addMessage(activeSessionId, userMsg);
    setIsThinking(activeSessionId, true);

    try {
      // 2. Call REST API
      const res = await apiSendMessage({
        session_id: activeSessionId,
        message: content,
        provider: provider
      });

      if (!res || !res.success || !res.data) {
        throw new Error(res?.error || "Failed to reach AI engine.");
      }
      
      const data = res.data as any; // Type casting for ease of access with checks
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid response from server: not an object");
      }

      if (!data.session_id) {
        console.error("Critical: Response missing session_id", data);
        throw new Error("Invalid server response: missing session_id");
      }

      const { model, switch: didSwitch, message_id, response } = data;

      // Mark user message as sent
      addMessage(activeSessionId, { ...userMsg, isSending: false });

      if (didSwitch) {
        addMessage(activeSessionId, {
          id: `${Date.now()}-switch`,
          session_id: activeSessionId,
          role: "system",
          content: `[Context handoff: Switched to ${model}]`,
          timestamp: Date.now()
        });
        switchModel(activeSessionId, model);
      }

      // 3. UI update strategy
      const isWsConnected = wsService.isConnected();
      
      if (!isWsConnected) {
        console.log("[useChat] WS disconnected, falling back to REST response");
        addMessage(activeSessionId, {
          id: message_id || `ai-${Date.now()}`,
          session_id: activeSessionId,
          role: "assistant",
          content: response,
          timestamp: Date.now(),
          modelUsed: model
        });
        setIsThinking(activeSessionId, false);
      } else {
        console.log("[useChat] REST trigger successful, waiting for WebSocket response");
      }
      
      logRequest(provider, estimateTokens(content));

    } catch (err: any) {
      console.error("Chat Error:", err);
      logError();
      setIsThinking(activeSessionId, false);

      addMessage(activeSessionId, {
        id: `err-${Date.now()}`,
        session_id: activeSessionId,
        role: "system",
        content: `Error: ${err.message || "Failed to reach AI engine."}`,
        timestamp: Date.now()
      });
    }

  };
  return { sendMessage };

}
