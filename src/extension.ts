import * as vscode from "vscode";

import { DiffReviewController } from "./diffReview/DiffReviewController";

let controller: DiffReviewController | undefined;

export function activate(context: vscode.ExtensionContext) {
  controller = new DiffReviewController(context);
  context.subscriptions.push(controller);
}

export function deactivate() {
  controller?.dispose();
  controller = undefined;
}
