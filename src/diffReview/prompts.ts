import { DiffHunk } from "./types";

function taggedBlock(tag: string, content: string): string {
  return [`<${tag}>`, content || "(empty)", `</${tag}>`].join("\n");
}

export function buildExplanationPrompt(hunk: DiffHunk): string {
  return [
    "Explain this code diff hunk for a software engineer reviewing changes.",
    "Be concrete and concise.",
    "Do not mention line numbers unless essential.",
    "Focus on what changed, behavior impact, and likely risks or assumptions.",
    "Return valid JSON matching the provided schema.",
    "",
    `Hunk kind: ${hunk.kind}`,
    `Modified file: ${hunk.modifiedUri}`,
    "",
    taggedBlock("context_before", hunk.contextBefore),
    "",
    taggedBlock("original", hunk.originalSnippet),
    "",
    taggedBlock("modified", hunk.modifiedSnippet),
    "",
    taggedBlock("context_after", hunk.contextAfter)
  ].join("\n");
}
