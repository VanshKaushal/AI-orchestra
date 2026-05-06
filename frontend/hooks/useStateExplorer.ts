import { useEffect, useState } from "react";
import { wsService } from "../services/websocket";

export function useStateExplorer(sessionId: string) {
  const [state, setState] = useState({
    goal: "Not specified",
    progress: 0,
    logs: [] as string[]
  });

  useEffect(() => {
    if (!sessionId) return;

    const fetchState = async () => {
      try {
        const { BASE_URL } = await import("../services/api");
        const res = await fetch(`${BASE_URL}/state/${sessionId}`);
        if (!res.ok) throw new Error("API failure");
        const json = await res.json();
        
        // Handle standardized wrapper
        if (json && json.success && json.data) {
          setState(json.data);
        } else if (json && !json.success) {
          console.warn("State Explorer: API returned error", json.error);
        }
      } catch (err) {
        // FAIL SILENTLY (critical requirement)
        console.warn("State Explorer: API polling failed, using current state.");
      }
    };

    fetchState();

    const handleUpdate = (payload: any) => {
      if (payload && payload.data) {
        setState(payload.data);
      }
    };

    wsService.on("state_explorer_update", handleUpdate);

    const interval = setInterval(fetchState, 3000);
    return () => {
      clearInterval(interval);
      wsService.off("state_explorer_update", handleUpdate);
    };
  }, [sessionId]);

  return state;
}
