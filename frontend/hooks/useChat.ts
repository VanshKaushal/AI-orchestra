"use client";

import { useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { wsService, WS_BASE_URL } from "../services/websocket";
import { sendMessage as apiSendMessage } from "../services/api";

export function useChat() {
  const { 
    activeSessionId, 
    addMessage, 
    setIsThinking, 
    addWatchdogLog,
    setGlobalState,
    switchModel
  } = useStore();

  const receivedMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!activeSessionId) return;

    // 1. Connect to session-specific channel
    const sessionUrl = `${WS_BASE_URL}/session/${activeSessionId}`;
    wsService.connect(sessionUrl);

    // 2. Event Handlers
    const handleNewMessage = (payload: any) => {
      if (payload.session_id === activeSessionId) {
        receivedMessageIds.current.add(payload.id);
        
        addMessage(payload.session_id, {
          id: payload.id,
          session_id: payload.session_id,
          role: payload.role === "ai" ? "assistant" : (payload.role || "assistant"),
          content: payload.content,
          timestamp: payload.timestamp || Date.now(),
          modelUsed: payload.provider
        });
        
        setIsThinking(payload.session_id, false);
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
    if (!activeSessionId) return;

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
      const res = await apiSendMessage(activeSessionId, content);
      const { response, model, switch: didSwitch, message_id } = res.data;

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

      // 3. Fallback Logic: Check if WS already delivered the message
      // Wait a short duration to give WS priority as requested
      setTimeout(() => {
        if (!receivedMessageIds.current.has(message_id)) {
          console.log("[useChat] WS missed message, using REST fallback");
          addMessage(activeSessionId, {
            id: message_id,
            session_id: activeSessionId,
            role: "assistant",
            content: response,
            timestamp: Date.now(),
            modelUsed: model
          });
          setIsThinking(activeSessionId, false);
        }
      }, 1000);

    } catch (err: any) {
      console.error("Chat Error:", err);
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
