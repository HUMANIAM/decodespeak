import * as vscode from "vscode";

import { DiffReviewController } from "./diffReview/DiffReviewController";
import {
  DecodeSpeakSidebarViewProvider,
  DECODE_SPEAK_OPEN_SIDEBAR_COMMAND,
  DECODE_SPEAK_SIDEBAR_VIEW_ID,
} from "./sidebar/DecodeSpeakSidebarViewProvider";

let controller: DiffReviewController | undefined;
let sidebarProvider: DecodeSpeakSidebarViewProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
  controller = new DiffReviewController(context);
  sidebarProvider = new DecodeSpeakSidebarViewProvider();

  context.subscriptions.push(
    controller,
    sidebarProvider,
    vscode.window.registerWebviewViewProvider(DECODE_SPEAK_SIDEBAR_VIEW_ID, sidebarProvider, {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    }),
    vscode.commands.registerCommand(DECODE_SPEAK_OPEN_SIDEBAR_COMMAND, () => sidebarProvider?.focus()),
  );

  if (process.env.DECODESPEAK_AUTO_OPEN_SIDEBAR === "1") {
    setTimeout(() => {
      void sidebarProvider?.focus();
    }, 200);
  }
}

export function deactivate() {
  controller?.dispose();
  sidebarProvider?.dispose();
  controller = undefined;
  sidebarProvider = undefined;
}
