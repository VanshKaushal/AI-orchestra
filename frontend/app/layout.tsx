import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import ClientWrapper from "../components/ClientWrapper";

export const metadata: Metadata = {
  title: "AI Orchestra OS",
  description: "A premium multi-LLM orchestration platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen w-screen overflow-hidden flex bg-gray-950 text-gray-200 selection:bg-blue-500/30 font-sans">
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
