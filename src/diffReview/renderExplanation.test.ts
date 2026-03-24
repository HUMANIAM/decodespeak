import { describe, expect, it } from "vitest";

import { INLINE_REVIEW_PROMPT, getInlineReviewPrompt } from "./renderExplanation";

describe("getInlineReviewPrompt", () => {
  it("falls back to the default inline prompt", () => {
    expect(getInlineReviewPrompt()).toBe(INLINE_REVIEW_PROMPT);
    expect(getInlineReviewPrompt("   ")).toBe(INLINE_REVIEW_PROMPT);
  });

  it("keeps a caller-provided prompt", () => {
    expect(getInlineReviewPrompt("review this change")).toBe("review this change");
  });
});
