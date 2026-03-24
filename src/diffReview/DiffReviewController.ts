import * as vscode from "vscode";

import { ActiveDiffResolver } from "./ActiveDiffResolver";
import { findHunkForLine } from "./lineDiff";
import { DiffReviewCodeLensProvider } from "./DiffReviewCodeLensProvider";
import { InlineReviewCommentManager } from "./InlineReviewCommentManager";
import { ActiveDiffContext, DiffHunk } from "./types";

function getConfiguration() {
  return vscode.workspace.getConfiguration("decodespeak");
}

export class DiffReviewController implements vscode.Disposable {
  private readonly resolver = new ActiveDiffResolver();
  private readonly codeLensProvider: DiffReviewCodeLensProvider;
  private readonly reviewComments = new InlineReviewCommentManager();
  private readonly disposables: vscode.Disposable[] = [];
  private previewExplainTriggered = false;

  constructor(_context: vscode.ExtensionContext) {
    this.codeLensProvider = new DiffReviewCodeLensProvider({
      resolveContext: (document) => this.resolveContext(document)
    });

    this.registerCodeLensProvider();
    this.registerCommands();
    this.registerRefreshListeners();
    this.disposables.push(this.reviewComments);
    void this.maybeAutoExplainForPreview();
  }

  dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

  private registerCodeLensProvider() {
    this.disposables.push(
      vscode.languages.registerCodeLensProvider(
        [{ scheme: "file" }, { scheme: "untitled" }],
        this.codeLensProvider,
      ),
    );
  }

  private registerCommands() {
    this.disposables.push(
      vscode.commands.registerCommand("decodespeak.explainActiveDiffHunk", () =>
        this.explainHunk(),
      ),
      vscode.commands.registerCommand("decodespeak.acceptActiveDiffHunk", () =>
        this.acceptHunk(),
      ),
      vscode.commands.registerCommand("decodespeak.revertActiveDiffHunk", () =>
        this.revertHunk(),
      ),
      vscode.commands.registerCommand("decodespeak.explainHunk", (hunkId?: string) =>
        this.explainHunk(hunkId),
      ),
      vscode.commands.registerCommand("decodespeak.acceptHunk", (hunkId?: string) =>
        this.acceptHunk(hunkId),
      ),
      vscode.commands.registerCommand("decodespeak.revertHunk", (hunkId?: string) =>
        this.revertHunk(hunkId),
      ),
    );
  }

  private registerRefreshListeners() {
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(() => {
        this.refreshUi();
        void this.maybeAutoExplainForPreview();
      }),
      vscode.window.onDidChangeVisibleTextEditors(() => {
        this.refreshUi();
        void this.maybeAutoExplainForPreview();
      }),
      vscode.window.tabGroups.onDidChangeTabs(() => {
        this.refreshUi();
        void this.maybeAutoExplainForPreview();
      }),
      vscode.workspace.onDidChangeTextDocument(() => this.refreshUi()),
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("decodespeak")) {
          this.refreshUi();
        }
      }),
    );
  }

  private refreshUi() {
    this.codeLensProvider.refresh();
  }

  private async resolveContext(
    document: vscode.TextDocument,
  ): Promise<ActiveDiffContext | undefined> {
    const contextLines = getConfiguration().get<number>("contextLines", 8);
    return this.resolver.getContextForDocument(document, contextLines);
  }

  private async resolveCurrentHunk(
    requestedHunkId?: string,
  ): Promise<{ context: ActiveDiffContext; hunk: DiffHunk } | undefined> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      void vscode.window.showInformationMessage("Open a diff editor to explain a hunk.");
      return undefined;
    }

    const context = await this.resolveContext(editor.document);

    if (!context) {
      void vscode.window.showInformationMessage(
        "DecodeSpeak works on the modified side of an active text diff editor.",
      );
      return undefined;
    }

    const hunk =
      context.hunks.find((candidate) => candidate.id === requestedHunkId) ??
      findHunkForLine(context.hunks, editor.selection.active.line);

    if (!hunk) {
      void vscode.window.showInformationMessage("No changed hunk found at the active cursor.");
      return undefined;
    }

    return { context, hunk };
  }

  private async explainHunk(requestedHunkId?: string) {
    const resolved = await this.resolveCurrentHunk(requestedHunkId);

    if (!resolved) {
      return;
    }

    this.reviewComments.showComposer(resolved.hunk);
    this.refreshUi();
  }

  private async acceptHunk(requestedHunkId?: string) {
    const dismissed = requestedHunkId
      ? this.reviewComments.dismissForHunk(requestedHunkId) || this.reviewComments.dismissActive()
      : this.reviewComments.dismissActive();

    if (!dismissed && !requestedHunkId) {
      void vscode.window.showInformationMessage("No open DecodeSpeak review is active.");
      return;
    }

    this.refreshUi();
  }

  private async revertHunk(_requestedHunkId?: string) {
    await vscode.window.showInformationMessage(
      "Per-hunk revert is not implemented yet. Explain opens the inline review form.",
    );
  }

  private async maybeAutoExplainForPreview() {
    if (process.env.DECODESPEAK_AUTO_EXPLAIN !== "1" || this.previewExplainTriggered) {
      return;
    }

    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const context = await this.resolveContext(editor.document);

    if (!context || context.hunks.length === 0) {
      return;
    }

    this.previewExplainTriggered = true;
    await this.explainHunk(context.hunks[0].id);
  }
}
