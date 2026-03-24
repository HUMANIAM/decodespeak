import { EventEmitter } from "node:events";
import * as fs from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { CodexCliExplanationService } from "./CodexCliExplanationService";
import { DiffHunk } from "./types";

class FakeChildProcess extends EventEmitter {
  readonly stdout = new EventEmitter();
  readonly stderr = new EventEmitter();
  readonly stdin = {
    write: (_value: string) => undefined,
    end: () => undefined
  };

  kill(_signal?: NodeJS.Signals) {
    return true;
  }
}

function createHunk(): DiffHunk {
  return {
    id: "abc123",
    kind: "modified",
    originalUri: "file:///before.ts",
    modifiedUri: "file:///after.ts",
    originalStartLine: 1,
    originalEndLine: 1,
    modifiedStartLine: 1,
    modifiedEndLine: 1,
    anchorLine: 1,
    originalSnippet: "return a + b;",
    modifiedSnippet: "return a + b + 1;",
    contextBefore: "function add(a, b) {",
    contextAfter: "}"
  };
}

describe("CodexCliExplanationService", () => {
  it("parses structured JSON from codex output", async () => {
    const spawnProcess = (
      _command: string,
      args: readonly string[],
    ) => {
      const child = new FakeChildProcess();
      const outputIndex = args.indexOf("--output-last-message");
      const outputPath = args[outputIndex + 1];

      queueMicrotask(async () => {
        await fs.writeFile(
          outputPath,
          JSON.stringify({
            summary: "Updates the return expression.",
            behavior: ["Adds one to the computed sum."],
            risks: ["May change callers that relied on the previous result."]
          }),
        );
        child.emit("close", 0);
      });

      return child as any;
    };

    const service = new CodexCliExplanationService({
      cliPath: "codex",
      model: null,
      timeoutMs: 1000,
      schemaPath: "/tmp/schema.json",
      cwd: "/tmp",
      spawnProcess
    });

    await expect(service.explain(createHunk())).resolves.toEqual({
      summary: "Updates the return expression.",
      behavior: ["Adds one to the computed sum."],
      risks: ["May change callers that relied on the previous result."]
    });
  });

  it("retries without schema enforcement when the first run fails", async () => {
    let callCount = 0;
    const spawnProcess = (
      _command: string,
      args: readonly string[],
    ) => {
      callCount += 1;
      const child = new FakeChildProcess();

      queueMicrotask(async () => {
        if (callCount === 1) {
          child.stderr.emit("data", "schema failure");
          child.emit("close", 1);
          return;
        }

        const outputIndex = args.indexOf("--output-last-message");
        const outputPath = args[outputIndex + 1];
        await fs.writeFile(
          outputPath,
          "```json\n" +
            JSON.stringify({
              summary: "Retry path succeeded.",
              behavior: [],
              risks: []
            }) +
            "\n```",
        );
        child.emit("close", 0);
      });

      return child as any;
    };

    const service = new CodexCliExplanationService({
      cliPath: "codex",
      model: null,
      timeoutMs: 1000,
      schemaPath: "/tmp/schema.json",
      cwd: "/tmp",
      spawnProcess
    });

    await expect(service.explain(createHunk())).resolves.toEqual({
      summary: "Retry path succeeded.",
      behavior: [],
      risks: []
    });
    expect(callCount).toBe(2);
  });
});
