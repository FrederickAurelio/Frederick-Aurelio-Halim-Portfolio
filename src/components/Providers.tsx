"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import ChatWidget from "@/components/chat/ChatWidget";
import { TextLanguage } from "@/context/TextContext";
import type { Language } from "@/utils/data";

type ProvidersProps = {
  children: React.ReactNode;
  initialLanguage: Language;
};

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function Providers({ children, initialLanguage }: ProvidersProps) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <TextLanguage initialLanguage={initialLanguage}>
        {children}
        <ChatWidget />
      </TextLanguage>
    </QueryClientProvider>
  );
}
