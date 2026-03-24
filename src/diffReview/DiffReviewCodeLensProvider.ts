import * as vscode from "vscode";

import { ActiveDiffContext, DiffHunk } from "./types";

interface DiffReviewCodeLensProviderOptions {
  resolveContext: (
    document: vscode.TextDocument,
  ) => Promise<ActiveDiffContext | undefined>;
}

function createCommand(
  title: string,
  command: string,
  hunk: DiffHunk,
): vscode.Command {
  return {
    title,
    command,
    arguments: [hunk.id]
  };
}

export class DiffReviewCodeLensProvider implements vscode.CodeLensProvider {
  private readonly onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();

  readonly onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event;

  constructor(private readonly options: DiffReviewCodeLensProviderOptions) {}

  refresh() {
    this.onDidChangeCodeLensesEmitter.fire();
  }

  async provideCodeLenses(
    document: vscode.TextDocument,
  ): Promise<vscode.CodeLens[]> {
    const context = await this.options.resolveContext(document);

    if (!context) {
      return [];
    }

    const codeLenses: vscode.CodeLens[] = [];

    for (const hunk of context.hunks) {
      const range = new vscode.Range(
        new vscode.Position(hunk.anchorLine, 0),
        new vscode.Position(hunk.anchorLine, 0),
      );

      codeLenses.push(
        new vscode.CodeLens(
          range,
          createCommand("$(light-bulb) Explain", "decodespeak.explainHunk", hunk),
        ),
        new vscode.CodeLens(
          range,
          createCommand("$(discard) Revert", "decodespeak.revertHunk", hunk),
        ),
        new vscode.CodeLens(
          range,
          createCommand("$(check) Accept", "decodespeak.acceptHunk", hunk),
        ),
      );
    }

    return codeLenses;
  }
}
