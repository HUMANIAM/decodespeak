import { describe, expect, it } from "vitest";

import { computeDiffHunks, findHunkForLine } from "./lineDiff";

describe("computeDiffHunks", () => {
  it("creates a modified hunk with modified-side ranges", () => {
    const hunks = computeDiffHunks(
      ["function add(a, b) {", "  return a + b;", "}"].join("\n"),
      ["function add(a, b) {", "  return a + b + 1;", "}"].join("\n"),
      {
        originalUri: "file:///before.ts",
        modifiedUri: "file:///after.ts",
        contextLines: 2
      },
    );

    expect(hunks).toHaveLength(1);
    expect(hunks[0]).toMatchObject({
      kind: "modified",
      originalStartLine: 1,
      originalEndLine: 1,
      modifiedStartLine: 1,
      modifiedEndLine: 1,
      anchorLine: 1,
      originalSnippet: "  return a + b;",
      modifiedSnippet: "  return a + b + 1;"
    });
  });

  it("anchors deletion-only hunks to a valid modified-side line", () => {
    const hunks = computeDiffHunks(
      ["a", "b", "c"].join("\n"),
      ["a", "c"].join("\n"),
      {
        originalUri: "file:///before.txt",
        modifiedUri: "file:///after.txt",
        contextLines: 1
      },
    );

    expect(hunks).toHaveLength(1);
    expect(hunks[0]).toMatchObject({
      kind: "removed",
      originalSnippet: "b",
      modifiedSnippet: ""
    });
    expect(hunks[0].anchorLine).toBe(1);
  });

  it("keeps separate hunks distinct", () => {
    const hunks = computeDiffHunks(
      ["a", "b", "c", "d"].join("\n"),
      ["a", "b changed", "c", "d changed"].join("\n"),
      {
        originalUri: "file:///before.txt",
        modifiedUri: "file:///after.txt",
        contextLines: 1
      },
    );

    expect(hunks).toHaveLength(2);
    expect(hunks.map((hunk) => hunk.modifiedStartLine)).toEqual([1, 3]);
  });
});

describe("findHunkForLine", () => {
  it("finds the hunk for an active cursor line", () => {
    const hunks = computeDiffHunks(
      ["zero", "one", "two"].join("\n"),
      ["zero", "one updated", "two"].join("\n"),
      {
        originalUri: "file:///before.txt",
        modifiedUri: "file:///after.txt",
        contextLines: 1
      },
    );

    expect(findHunkForLine(hunks, 1)?.id).toBe(hunks[0].id);
  });

  it("finds deletion-only hunks anchored at the end of the file", () => {
    const hunks = computeDiffHunks(
      ["keep", "delete me"].join("\n"),
      ["keep"].join("\n"),
      {
        originalUri: "file:///before.txt",
        modifiedUri: "file:///after.txt",
        contextLines: 1
      },
    );

    expect(findHunkForLine(hunks, 0)?.id).toBe(hunks[0].id);
  });
});
