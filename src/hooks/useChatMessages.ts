"use client";

import { useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { ChatApiError, toNetworkChatApiError } from "@/lib/chat/api-error";
import {
  CHAT_MESSAGES_QUERY_KEY,
  PAGE_SIZE,
  fetchChatMessagesPage,
} from "@/lib/chat/fetch-messages";

function normalizeHistoryError(error: unknown): ChatApiError | null {
  if (!error) return null;
  if (error instanceof ChatApiError) return error;
  return toNetworkChatApiError(error);
}

export function useChatMessages() {
  const query = useInfiniteQuery({
    queryKey: CHAT_MESSAGES_QUERY_KEY,
    queryFn: ({ pageParam }) => fetchChatMessagesPage(pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    retry: false,
  });

  const storedPages = useMemo(
    () => query.data?.pages.map((page) => page.messages) ?? [],
    [query.data],
  );
  const retentionSeconds = query.data?.pages[0]?.retentionSeconds ?? null;

  const historyError = useMemo(
    () => normalizeHistoryError(query.error),
    [query.error],
  );

  const isRefetchingHistory = query.isFetching && query.isError;

  return {
    storedPages,
    retentionSeconds,
    isLoadingHistory: query.isLoading,
    isRefetchingHistory,
    isHistoryError: query.isError,
    historyError,
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
