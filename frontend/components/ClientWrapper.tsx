"use client";

import React, { useEffect } from "react";
import { wsService } from "../services/websocket";
import { Toaster } from "react-hot-toast";

export default function ClientWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  useEffect(() => {
    wsService.connect();
    
    // Global Error Logger logic
    const handler = (e: PromiseRejectionEvent) => {
      console.error("UNHANDLED ERROR:", e.reason);
    };
    window.addEventListener("unhandledrejection", handler);
    
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      {children}
    </>
  );
}
