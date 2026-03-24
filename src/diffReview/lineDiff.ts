import { createHash } from "node:crypto";

import { diffArrays } from "diff";

import { DiffHunk, HunkKind } from "./types";

interface ComputeDiffHunksOptions {
  originalUri: string;
  modifiedUri: string;
  contextLines: number;
}

function splitLines(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  if (normalized.endsWith("\n")) {
    lines.pop();
  }

  return lines;
}

function joinLines(lines: string[]): string {
  return lines.join("\n");
}

function toHunkKind(removedCount: number, addedCount: number): HunkKind {
  if (removedCount > 0 && addedCount > 0) {
    return "modified";
  }

  if (removedCount > 0) {
    return "removed";
  }

  return "added";
}

function clampAnchorLine(
  modifiedStartLine: number,
  modifiedEndLine: number,
  modifiedLineCount: number,
): number {
  if (modifiedLineCount <= 0) {
    return 0;
  }

  if (modifiedEndLine >= modifiedStartLine && modifiedStartLine >= 0) {
    return Math.min(modifiedStartLine, modifiedLineCount - 1);
  }

  return Math.min(Math.max(modifiedStartLine, 0), modifiedLineCount - 1);
}

function createHunkId(input: string): string {
  return createHash("sha1").update(input).digest("hex").slice(0, 12);
}

export function computeDiffHunks(
  originalText: string,
  modifiedText: string,
  options: ComputeDiffHunksOptions,
): DiffHunk[] {
  const originalLines = splitLines(originalText);
  const modifiedLines = splitLines(modifiedText);
  const changes = diffArrays(originalLines, modifiedLines);

  const hunks: DiffHunk[] = [];
  let originalIndex = 0;
  let modifiedIndex = 0;

  for (let index = 0; index < changes.length; index++) {
    const change = changes[index];

    if (!change.added && !change.removed) {
      originalIndex += change.value.length;
      modifiedIndex += change.value.length;
      continue;
    }

    const originalStartLine = originalIndex;
    const modifiedStartLine = modifiedIndex;
    const removedLines: string[] = [];
    const addedLines: string[] = [];

    while (index < changes.length && (changes[index].added || changes[index].removed)) {
      const currentChange = changes[index];

      if (currentChange.removed) {
        removedLines.push(...currentChange.value);
        originalIndex += currentChange.value.length;
      } else if (currentChange.added) {
        addedLines.push(...currentChange.value);
        modifiedIndex += currentChange.value.length;
      }

      index += 1;
    }

    index -= 1;

    const originalEndLine =
      removedLines.length > 0
        ? originalStartLine + removedLines.length - 1
        : originalStartLine - 1;
    const modifiedEndLine =
      addedLines.length > 0
        ? modifiedStartLine + addedLines.length - 1
        : modifiedStartLine - 1;
    const anchorLine = clampAnchorLine(
      modifiedStartLine,
      modifiedEndLine,
      modifiedLines.length,
    );
    const contextBeforeStart = Math.max(0, anchorLine - options.contextLines);
    const contextAfterEnd = Math.min(
      modifiedLines.length,
      anchorLine + options.contextLines + 1,
    );
    const contextBefore = joinLines(
      modifiedLines.slice(contextBeforeStart, anchorLine),
    );
    const contextAfter = joinLines(
      modifiedLines.slice(anchorLine + 1, contextAfterEnd),
    );
    const originalSnippet = joinLines(removedLines);
    const modifiedSnippet = joinLines(addedLines);
    const id = createHunkId(
      [
        options.originalUri,
        options.modifiedUri,
        originalStartLine,
        originalEndLine,
        modifiedStartLine,
        modifiedEndLine,
        originalSnippet,
        modifiedSnippet
      ].join("|"),
    );

    hunks.push({
      id,
      kind: toHunkKind(removedLines.length, addedLines.length),
      originalUri: options.originalUri,
      modifiedUri: options.modifiedUri,
      originalStartLine,
      originalEndLine,
      modifiedStartLine,
      modifiedEndLine,
      anchorLine,
      originalSnippet,
      modifiedSnippet,
      contextBefore,
      contextAfter
    });
  }

  return hunks;
}

export function findHunkForLine(
  hunks: DiffHunk[],
  line: number,
): DiffHunk | undefined {
  return hunks.find((hunk) => {
    const startLine = Math.min(hunk.modifiedStartLine, hunk.anchorLine);
    const endLine =
      hunk.modifiedEndLine >= hunk.modifiedStartLine
        ? hunk.modifiedEndLine
        : hunk.anchorLine;

    return line >= startLine && line <= endLine;
  });
}
