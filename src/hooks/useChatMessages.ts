"use client";

import { useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  CHAT_MESSAGES_QUERY_KEY,
  PAGE_SIZE,
  fetchChatMessagesPage,
} from "@/lib/chat/fetch-messages";

export function useChatMessages() {
  const query = useInfiniteQuery({
    queryKey: CHAT_MESSAGES_QUERY_KEY,
    queryFn: ({ pageParam }) => fetchChatMessagesPage(pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });

  const storedPages = useMemo(
    () => query.data?.pages.map((page) => page.messages) ?? [],
    [query.data],
  );
  const retentionSeconds = query.data?.pages[0]?.retentionSeconds ?? null;

  return {
    storedPages,
    retentionSeconds,
    isLoadingHistory: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetchHistory: query.refetch,
  };
}

export function useInvalidateChatMessages() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_QUERY_KEY });
}

export { PAGE_SIZE };
