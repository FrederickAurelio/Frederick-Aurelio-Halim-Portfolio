import type { OpenRouterMessage } from "@/lib/openrouter/types";

import {
  enrichRetrievalPlanHeavy,
  enrichRetrievalPlanLight,
} from "./enrich-retrieval-plan";
import { fallbackRetrievalPlan } from "./navigator-fallback";
import { callNavigatorLlm } from "./navigator";
import {
  applySessionRoutingToPlan,
  computeNextRoutingState,
  type SessionRoutingState,
} from "./session-routing-state";
import { defaultRetrievalPlan, type RetrievalPlan } from "./retrieval-plan";

export type PlanRetrievalResult = {
  plan: RetrievalPlan;
  nextRoutingState: SessionRoutingState;
  source: "navigator" | "fallback";
};

function normalizeNavigatorPlan(plan: RetrievalPlan, currentMessage: string): RetrievalPlan {
  if (
    plan.intent === "list_projects" ||
    plan.intent === "recommend_project" ||
    plan.intent === "multi_project" ||
    plan.intent === "multi_doc" ||
    plan.intent === "off_topic"
  ) {
    return defaultRetrievalPlan({
      ...plan,
      search_queries: [],
    });
  }

  if (plan.search_queries.length === 0) {
    return defaultRetrievalPlan({
      ...plan,
      search_queries: [currentMessage.trim()],
    });
  }

  return plan;
}

export async function planRetrievalForTurn(
  history: OpenRouterMessage[],
  currentMessage: string,
  routingState: SessionRoutingState,
  signal?: AbortSignal,
): Promise<PlanRetrievalResult> {
  const navigator = await callNavigatorLlm(
    history,
    currentMessage,
    routingState,
    signal,
  );

  if (navigator.ok) {
    const normalized = normalizeNavigatorPlan(navigator.plan, currentMessage);
    const withSession = applySessionRoutingToPlan(
      normalized,
      currentMessage,
      routingState,
    );
    const plan = enrichRetrievalPlanLight(withSession, currentMessage, history);
    const nextRoutingState = computeNextRoutingState(
      routingState,
      plan,
      currentMessage,
    );
    return { plan, nextRoutingState, source: "navigator" };
  }

  const fallbackPlan = fallbackRetrievalPlan(history, currentMessage);
  const heavy = enrichRetrievalPlanHeavy(fallbackPlan, history, currentMessage);
  const plan = applySessionRoutingToPlan(heavy, currentMessage, routingState);
  const nextRoutingState = computeNextRoutingState(
    routingState,
    plan,
    currentMessage,
  );
  return { plan, nextRoutingState, source: "fallback" };
}
