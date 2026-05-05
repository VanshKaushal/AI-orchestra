import { create } from "zustand";

interface ProviderStats {
  requests: number;
  tokens: number;
}

interface AnalyticsState {
  totalMessages: number;
  totalErrors: number;
  providers: Record<string, ProviderStats>;
  logRequest: (provider: string, tokens?: number) => void;
  logError: () => void;
}

export const useAnalytics = create<AnalyticsState>((set) => ({
  totalMessages: 0,
  totalErrors: 0,

  providers: {
    OpenAI: { requests: 0, tokens: 0 },
    Anthropic: { requests: 0, tokens: 0 },
    Gemini: { requests: 0, tokens: 0 },
    Grok: { requests: 0, tokens: 0 },
    Ollama: { requests: 0, tokens: 0 },
  },

  logRequest: (provider, tokens = 0) =>
    set((state) => {
      const providerKey = Object.keys(state.providers).find(
        (key) => (key || "").toLowerCase() === (provider || "").toLowerCase()
      ) || "Ollama"; // Fallback to Ollama if not found

      return {
        totalMessages: state.totalMessages + 1,
        providers: {
          ...state.providers,
          [providerKey]: {
            requests: (state.providers[providerKey]?.requests || 0) + 1,
            tokens: (state.providers[providerKey]?.tokens || 0) + tokens,
          },
        },
      };
    }),

  logError: () =>
    set((state) => ({
      totalErrors: state.totalErrors + 1,
    })),
}));
