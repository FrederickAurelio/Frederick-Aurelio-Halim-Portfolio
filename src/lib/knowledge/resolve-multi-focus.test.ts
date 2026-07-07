import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildMultiDocAnswerHint,
  describeDocCoverage,
  filterFocusDocIds,
  inferSectionsForMultiDoc,
  inferSectionsForMultiProject,
  planFromMultiFocusSet,
  resolveDocIdsFromMessage,
  resolveMultiDocFocus,
  resolveMultiFocusSet,
  resolveMultiProjectFocus,
  SHOWCASE_PROJECT_DOC_IDS,
} from "./resolve-multi-focus";

describe("resolveDocIdsFromMessage", () => {
  it("combines explicit names and implicit education/work signals", () => {
    const ids = resolveDocIdsFromMessage(
      "chronologically from when you enter uni and list all your work time",
    );
    assert.ok(ids.includes("about-me"));
    assert.ok(ids.includes("work-experience"));
  });

  it("resolves explicit project names", () => {
    const ids = resolveDocIdsFromMessage("QuizConnect and Memories");
    assert.ok(ids.includes("quizconnect"));
    assert.ok(ids.includes("memories"));
  });
});

describe("filterFocusDocIds", () => {
  it("drops projects-overview when specific projects are present", () => {
    const filtered = filterFocusDocIds([
      "projects-overview",
      "quizconnect",
      "memories",
    ]);
    assert.ok(!filtered.includes("projects-overview"));
    assert.equal(filtered.length, 2);
  });
});

describe("resolveMultiProjectFocus", () => {
  it("detects two named projects with stack aspect", () => {
    const result = resolveMultiProjectFocus(
      "tech stack for QuizConnect and Memories",
      "",
    );
    assert.ok(result);
    assert.equal(result.reason, "explicit_names");
    assert.ok(result.docIds.includes("quizconnect"));
    assert.ok(result.docIds.includes("memories"));
  });

  it("detects all four showcase projects", () => {
    const result = resolveMultiProjectFocus("tell me about all four projects", "");
    assert.ok(result);
    assert.deepEqual(result.docIds, [...SHOWCASE_PROJECT_DOC_IDS]);
  });

  it("returns null for single project", () => {
    assert.equal(resolveMultiProjectFocus("QuizConnect tech stack", ""), null);
  });
});

describe("resolveMultiDocFocus", () => {
  it("detects education + work without hardcoded doc pair", () => {
    const result = resolveMultiDocFocus(
      "give me your chronologically from when you start enter uni and list all your work time",
      "",
    );
    assert.ok(result);
    assert.ok(result.docIds.includes("about-me"));
    assert.ok(result.docIds.includes("work-experience"));
  });

  it("detects mixed bio and project question", () => {
    const result = resolveMultiDocFocus(
      "tell me about your education and QuizConnect stack",
      "",
    );
    assert.ok(result);
    assert.ok(result.docIds.includes("about-me"));
    assert.ok(result.docIds.includes("quizconnect"));
  });

  it("defers to multi_project when only projects match", () => {
    assert.equal(
      resolveMultiDocFocus("compare QuizConnect vs Memories", ""),
      null,
    );
    const project = resolveMultiProjectFocus("compare QuizConnect vs Memories", "");
    assert.ok(project);
  });

  it("work experience plus two projects uses multi_doc with all three", () => {
    const result = resolveMultiFocusSet(
      "work experience and QuizConnect and Memories",
      "",
    );
    assert.ok(result);
    assert.equal(result.intent, "multi_doc");
    assert.ok(result.docIds.includes("work-experience"));
    assert.ok(result.docIds.includes("quizconnect"));
    assert.ok(result.docIds.includes("memories"));
  });

  it("work experience and some projects resolves overview plus work", () => {
    const ids = resolveDocIdsFromMessage(
      "tell me about your work experience and some of your projects",
    );
    assert.ok(ids.includes("work-experience"));
    assert.ok(ids.includes("projects-overview"));

    const result = resolveMultiDocFocus(
      "tell me about your work experience and some of your projects",
      "",
    );
    assert.ok(result);
    assert.equal(result.docIds.length, 2);
  });

  it("work experience and all four projects includes work plus showcase", () => {
    const result = resolveMultiFocusSet(
      "my work experience and all four projects",
      "",
    );
    assert.ok(result);
    assert.equal(result.intent, "multi_doc");
    assert.ok(result.docIds.includes("work-experience"));
    assert.ok(result.docIds.includes("quizconnect"));
    assert.equal(result.docIds.length, 4);
  });

  it("timeline plus biggest project adds quizconnect and stays multi_doc", () => {
    const msg =
      "give me your chronologically from when you start enter uni and list all your work time. ofc with what you do on the work.. after that your biggest project";
    const result = resolveMultiFocusSet(msg, "");
    assert.ok(result);
    assert.equal(result.intent, "multi_doc");
    assert.ok(result.docIds.includes("about-me"));
    assert.ok(result.docIds.includes("work-experience"));
    assert.ok(result.docIds.includes("quizconnect"));
  });

  it("education plus recommend a project becomes multi_doc with about-me and quizconnect", () => {
    const result = resolveMultiFocusSet("education history then recommend a project", "");
    assert.ok(result);
    assert.equal(result.intent, "multi_doc");
    assert.ok(result.docIds.includes("about-me"));
    assert.ok(result.docIds.includes("quizconnect"));
  });

  it("pure where should I start stays single-topic (no multi_doc)", () => {
    assert.equal(resolveMultiFocusSet("where should I start?", ""), null);
  });

  it("work and study in china resolves about-me and work-experience without borrowing project context", () => {
    const message =
      "so you both work and study in china? is there any other country you work or study at?";
    const context =
      "FXTrade is a forex dashboard. It uses Frankfurter API for currency data and lightweight-charts.";
    const result = resolveMultiFocusSet(message, context);
    assert.ok(result);
    assert.equal(result.intent, "multi_doc");
    assert.ok(result.docIds.includes("about-me"));
    assert.ok(result.docIds.includes("work-experience"));
    assert.ok(!result.docIds.includes("nextjs-fxtrade"));
  });
});

describe("buildMultiDocAnswerHint", () => {
  it("lists what each focused doc covers", () => {
    const hint = buildMultiDocAnswerHint(
      ["about-me", "work-experience", "quizconnect"],
      "chronological from uni and work then biggest project",
    );
    assert.match(hint, /about-me.*education/i);
    assert.match(hint, /work-experience.*Mufy/i);
    assert.match(hint, /quizconnect/i);
    assert.match(hint, /chronolog/i);
  });
});

describe("describeDocCoverage", () => {
  it("maps doc types to coverage phrases", () => {
    assert.match(describeDocCoverage("about-me"), /education/i);
    assert.match(describeDocCoverage("work-experience"), /Mufy/i);
    assert.match(describeDocCoverage("quizconnect"), /QuizConnect/i);
  });
});

describe("planFromMultiFocusSet", () => {
  it("builds multi_doc plan with per-doc answer hint", () => {
    const multi = resolveMultiFocusSet(
      "education and work experience",
      "",
    );
    assert.ok(multi);
    const plan = planFromMultiFocusSet(multi, "education and work experience");
    assert.equal(plan.intent, "multi_doc");
    assert.match(plan.answer_hint ?? "", /about-me/);
    assert.match(plan.answer_hint ?? "", /work-experience/);
  });
});

describe("inferSectionsForMultiDoc", () => {
  it("adds education and mufy sections for chronology question", () => {
    const sections = inferSectionsForMultiDoc(
      "chronological timeline from uni and work",
      ["about-me", "work-experience"],
    );
    assert.ok(sections.includes("education"));
    assert.ok(sections.includes("mufy-at-a-glance"));
  });
});

describe("inferSectionsForMultiProject", () => {
  it("adds tech-stack for stack questions", () => {
    const sections = inferSectionsForMultiProject("what stack for both?");
    assert.ok(sections.includes("tech-stack"));
  });
});
