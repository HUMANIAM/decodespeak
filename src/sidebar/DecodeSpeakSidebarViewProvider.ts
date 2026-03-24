import * as path from "node:path";
import * as vscode from "vscode";

import { renderDecodeSpeakSidebarHtml, type DecodeSpeakSidebarState } from "./renderSidebar";

export const DECODE_SPEAK_CONTAINER_ID = "decodespeak";
export const DECODE_SPEAK_SIDEBAR_VIEW_ID = "decodespeak.sidebarView";
export const DECODE_SPEAK_OPEN_SIDEBAR_COMMAND = "decodespeak.openSidebar";

function createNonce(): string {
  return Math.random().toString(36).slice(2);
}

function getActiveTabInput(): vscode.TabInputTextDiff | undefined {
  const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
  return activeTab?.input instanceof vscode.TabInputTextDiff ? activeTab.input : undefined;
}

function getSidebarState(): DecodeSpeakSidebarState {
  const editor = vscode.window.activeTextEditor;
  const diffInput = getActiveTabInput();

  if (diffInput) {
    return {
      activeFileLabel: path.basename(diffInput.modified.fsPath),
      editorModeLabel: "Diff editor active",
      guidance: "Pick a changed hunk in the diff, then use Decode active hunk to start the review flow.",
    };
  }

  if (editor) {
    return {
      activeFileLabel: path.basename(editor.document.fileName) || editor.document.fileName,
      editorModeLabel: "Standard editor active",
      guidance: "Open a diff editor when you want DecodeSpeak to review code changes instead of a single file.",
    };
  }

  return {
    activeFileLabel: "No active editor",
    editorModeLabel: "Waiting for context",
    guidance: "Open a file or diff editor, then return here to drive the review flow from the sidebar.",
  };
}

export class DecodeSpeakSidebarViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  private view: vscode.WebviewView | undefined;
  private readonly disposables: vscode.Disposable[] = [];

  constructor() {
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(() => this.refresh()),
      vscode.window.onDidChangeVisibleTextEditors(() => this.refresh()),
      vscode.window.tabGroups.onDidChangeTabs(() => this.refresh()),
    );
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };
    webviewView.description = "Diff review";
    webviewView.webview.onDidReceiveMessage(
      async (message: { type?: string }) => {
        if (message.type === "decode") {
          await vscode.commands.executeCommand("decodespeak.explainActiveDiffHunk");
          return;
        }

        if (message.type === "settings") {
          await vscode.commands.executeCommand("workbench.action.openSettings", "decodespeak");
        }
      },
      undefined,
      this.disposables,
    );

    this.refresh();
  }

  async focus() {
    await vscode.commands.executeCommand(`workbench.view.extension.${DECODE_SPEAK_CONTAINER_ID}`);
  }

  dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

  private refresh() {
    if (!this.view) {
      return;
    }

    const nonce = createNonce();
    this.view.webview.html = renderDecodeSpeakSidebarHtml(
      getSidebarState(),
      this.view.webview.cspSource,
      nonce,
    );
  }
}
