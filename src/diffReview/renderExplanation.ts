export const INLINE_REVIEW_PROMPT = "review this";

export function getInlineReviewPrompt(value?: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : INLINE_REVIEW_PROMPT;
}
