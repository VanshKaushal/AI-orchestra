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
        const res = await fetch(`http://127.0.0.1:8000/state/${sessionId}`);
        if (!res.ok) throw new Error("API failure");
        const data = await res.json();
        setState(data);
      } catch (err) {
        // FAIL SILENTLY (critical requirement)
        console.warn("State Explorer: API polling failed, using current state.");
      }
    };

    fetchState();

    const handleUpdate = (data: any) => {
      setState(data);
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
