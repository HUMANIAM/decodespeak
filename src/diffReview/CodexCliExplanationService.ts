import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import {
  ChildProcessWithoutNullStreams,
  SpawnOptionsWithoutStdio,
  spawn
} from "node:child_process";

import { buildExplanationPrompt } from "./prompts";
import { DiffHunk, ExplanationPayload } from "./types";

type SpawnLike = (
  command: string,
  args: readonly string[],
  options: SpawnOptionsWithoutStdio,
) => ChildProcessWithoutNullStreams;

export interface CodexCliExplanationServiceOptions {
  cliPath: string;
  model: string | null;
  timeoutMs: number;
  schemaPath: string;
  cwd: string;
  spawnProcess?: SpawnLike;
  log?: (message: string) => void;
}

function stripCodeFenceWrappers(raw: string): string {
  const trimmed = raw.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function isExplanationPayload(value: unknown): value is ExplanationPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.summary === "string" &&
    Array.isArray(candidate.behavior) &&
    candidate.behavior.every((entry) => typeof entry === "string") &&
    Array.isArray(candidate.risks) &&
    candidate.risks.every((entry) => typeof entry === "string")
  );
}

async function removeIfPresent(filePath: string) {
  await fs.rm(filePath, { force: true }).catch(() => undefined);
}

export class CodexCliExplanationService {
  private readonly spawnProcess: SpawnLike;

  constructor(private readonly options: CodexCliExplanationServiceOptions) {
    this.spawnProcess = options.spawnProcess ?? spawn;
  }

  async explain(hunk: DiffHunk): Promise<ExplanationPayload> {
    const tempDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "decodespeak-"),
    );
    const outputPath = path.join(tempDirectory, "explanation.json");
    const prompt = buildExplanationPrompt(hunk);

    try {
      await this.runCodex(prompt, outputPath, true);
      return await this.readExplanation(outputPath);
    } catch (error) {
      this.options.log?.(
        `Primary Codex invocation failed, retrying without schema enforcement: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      await this.runCodex(
        `${prompt}\n\nReturn JSON only with keys: summary, behavior, risks.`,
        outputPath,
        false,
      );
      return await this.readExplanation(outputPath);
    } finally {
      await removeIfPresent(outputPath);
      await removeIfPresent(tempDirectory);
    }
  }

  private buildArgs(outputPath: string, useSchema: boolean): string[] {
    const args = [
      "exec",
      "--skip-git-repo-check",
      "--sandbox",
      "read-only",
      "--ephemeral",
      "-C",
      this.options.cwd,
      "--output-last-message",
      outputPath
    ];

    if (this.options.model) {
      args.push("--model", this.options.model);
    }

    if (useSchema) {
      args.push("--output-schema", this.options.schemaPath);
    }

    return args;
  }

  private async runCodex(
    prompt: string,
    outputPath: string,
    useSchema: boolean,
  ): Promise<void> {
    await removeIfPresent(outputPath);

    const args = this.buildArgs(outputPath, useSchema);
    this.options.log?.(`Running Codex CLI: ${this.options.cliPath} ${args.join(" ")}`);

    await new Promise<void>((resolve, reject) => {
      const child = this.spawnProcess(this.options.cliPath, args, {
        cwd: this.options.cwd,
        stdio: ["pipe", "pipe", "pipe"]
      });

      let stderr = "";
      let stdout = "";
      const timer = setTimeout(() => {
        child.kill("SIGTERM");
        reject(new Error(`Codex CLI timed out after ${this.options.timeoutMs}ms`));
      }, this.options.timeoutMs);

      child.stdout.on("data", (chunk: Buffer | string) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });

      child.on("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });

      child.on("close", (code) => {
        clearTimeout(timer);

        if (code === 0) {
          if (stderr.trim()) {
            this.options.log?.(stderr.trim());
          }
          if (stdout.trim()) {
            this.options.log?.(stdout.trim());
          }
          resolve();
          return;
        }

        reject(
          new Error(
            `Codex CLI exited with code ${code}. ${stderr.trim() || stdout.trim()}`,
          ),
        );
      });

      child.stdin.write(prompt);
      child.stdin.end();
    });
  }

  private async readExplanation(outputPath: string): Promise<ExplanationPayload> {
    const raw = await fs.readFile(outputPath, "utf8");
    const parsed = JSON.parse(stripCodeFenceWrappers(raw)) as unknown;

    if (!isExplanationPayload(parsed)) {
      throw new Error("Codex CLI returned JSON in an unexpected shape");
    }

    return parsed;
  }
}
