import * as vscode from "vscode";

import { computeDiffHunks } from "./lineDiff";
import { ActiveDiffContext } from "./types";

function isTextDiffInput(input: unknown): input is vscode.TabInputTextDiff {
  return input instanceof vscode.TabInputTextDiff;
}

function findDiffInputForDocument(
  document: vscode.TextDocument,
): vscode.TabInputTextDiff | undefined {
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      if (!isTextDiffInput(tab.input)) {
        continue;
      }

      if (tab.input.modified.toString() === document.uri.toString()) {
        return tab.input;
      }
    }
  }

  return undefined;
}

function findVisibleOriginalDocument(
  document: vscode.TextDocument,
): vscode.TextDocument | undefined {
  const activeEditor = vscode.window.activeTextEditor;

  if (!activeEditor || activeEditor.document.uri.toString() !== document.uri.toString()) {
    return undefined;
  }

  const siblingEditor = vscode.window.visibleTextEditors.find(
    (editor) => editor.document.uri.toString() !== document.uri.toString(),
  );

  return siblingEditor?.document;
}

export class ActiveDiffResolver {
  async getContextForDocument(
    document: vscode.TextDocument,
    contextLines: number,
  ): Promise<ActiveDiffContext | undefined> {
    const diffInput = findDiffInputForDocument(document);
    const fallbackOriginalDocument = !diffInput
      ? findVisibleOriginalDocument(document)
      : undefined;

    if (!diffInput && !fallbackOriginalDocument) {
      return undefined;
    }

    const originalDocument =
      fallbackOriginalDocument ??
      (await vscode.workspace.openTextDocument(diffInput!.original));
    const original = diffInput?.original ?? originalDocument.uri;
    const modified = diffInput?.modified ?? document.uri;
    const hunks = computeDiffHunks(originalDocument.getText(), document.getText(), {
      originalUri: original.toString(),
      modifiedUri: modified.toString(),
      contextLines
    });

    return {
      originalUri: original.toString(),
      modifiedUri: modified.toString(),
      hunks
    };
  }
}
