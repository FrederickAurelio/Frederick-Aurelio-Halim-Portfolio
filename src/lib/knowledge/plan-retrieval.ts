import type { OpenRouterMessage } from "@/lib/openrouter/types";

import { loadKnowledgeMap } from "./load-knowledge-map";
import { callNavigatorLlm } from "./navigator";
import {
  finalizePlan,
  simpleFallbackPlan,
  type RetrievalPlan,
} from "./retrieval-plan";
import {
  computeNextRoutingState,
  docTitleForId,
  isVagueFollowUp,
  type SessionRoutingState,
} from "./session-routing-state";

export type PlanRetrievalResult = {
  plan: RetrievalPlan;
  nextRoutingState: SessionRoutingState;
  source: "navigator" | "fallback";
};

export async function planRetrievalForTurn(
  history: OpenRouterMessage[],
  currentMessage: string,
  routingState: SessionRoutingState,
  signal?: AbortSignal,
): Promise<PlanRetrievalResult> {
  const map = loadKnowledgeMap();
  const navigator = await callNavigatorLlm(
    history,
    currentMessage,
    routingState,
    signal,
  );

  const rawPlan = navigator.ok
    ? navigator.plan
    : simpleFallbackPlan(currentMessage, routingState.primaryDocId);

  const plan = finalizePlan(rawPlan, {
    message: currentMessage,
    primaryDocId: routingState.primaryDocId,
    map,
    applySticky: true,
    isVagueFollowUp,
    docTitle: docTitleForId,
  });

  const nextRoutingState = computeNextRoutingState(
    routingState,
    plan,
    currentMessage,
  );

  return {
    plan,
    nextRoutingState,
    source: navigator.ok ? "navigator" : "fallback",
  };
}
