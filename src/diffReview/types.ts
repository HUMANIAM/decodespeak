export interface ExplanationPayload {
  summary: string;
  behavior: string[];
  risks: string[];
}

export type HunkKind = "added" | "removed" | "modified";

export interface DiffHunk {
  id: string;
  kind: HunkKind;
  originalUri: string;
  modifiedUri: string;
  originalStartLine: number;
  originalEndLine: number;
  modifiedStartLine: number;
  modifiedEndLine: number;
  anchorLine: number;
  originalSnippet: string;
  modifiedSnippet: string;
  contextBefore: string;
  contextAfter: string;
}

export interface ActiveDiffContext {
  originalUri: string;
  modifiedUri: string;
  hunks: DiffHunk[];
}

export interface HunkState {
  hunkId: string;
  status: "idle" | "loading" | "ready" | "error";
  explanation?: ExplanationPayload;
  error?: string;
}
