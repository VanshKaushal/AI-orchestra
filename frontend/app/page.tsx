"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SessionTabs from "../components/SessionTabs";
import ChatWindow from "../components/ChatWindow";
import InputBox from "../components/InputBox";
import StatePanel from "../components/StatePanel";
import WatchdogFeed from "../components/WatchdogFeed";
import CommandPanel from "../components/CommandPanel";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

export default function OrchestraOS() {
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a] text-white selection:bg-blue-500/30">
      {/* LEFT PANEL: Sidebar */}
      <Sidebar />

      {/* CENTER PANEL: Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-zinc-800/50 relative">
        <Header rightPanelOpen={rightPanelOpen} setRightPanelOpen={setRightPanelOpen} />
        {/* <SessionTabs /> */} {/* Assuming we might keep or conditionally render based on preference, but keeping it per rule DO NOT REMOVE LOGIC */}
        
        <div className="flex flex-col flex-1 overflow-hidden relative">
          <ChatWindow />
          <InputBox />
        </div>
      </div>

      {/* RIGHT PANEL: State & Watchdog */}
      <div 
        className={`flex flex-col shrink-0 bg-zinc-900 border-l border-zinc-800/50 overflow-hidden transition-all duration-300 ease-in-out ${
          rightPanelOpen ? "w-72 opacity-100" : "w-0 opacity-0 border-none"
        }`}
      >
        <div className="flex flex-col h-full min-w-[18rem]">
          <div className="flex-1 overflow-y-auto">
            <StatePanel />
          </div>
          <div className="shrink-0 flex flex-col border-t border-zinc-800/50">
            <WatchdogFeed />
            <CommandPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
