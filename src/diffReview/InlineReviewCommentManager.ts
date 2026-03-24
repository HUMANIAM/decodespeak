import * as vscode from "vscode";

import { getInlineReviewPrompt } from "./renderExplanation";
import { DiffHunk } from "./types";

interface ActiveThread {
  hunkId: string;
  modifiedUri: string;
  thread: vscode.CommentThread;
}

function getThreadAnchorLine(hunk: DiffHunk): number {
  if (hunk.modifiedEndLine >= hunk.modifiedStartLine) {
    return hunk.modifiedEndLine;
  }

  return hunk.anchorLine;
}

export class InlineReviewCommentManager implements vscode.Disposable {
  private readonly commentController = vscode.comments.createCommentController(
    "decodespeak-inline-review",
    "DecodeSpeak",
  );

  private activeThread: ActiveThread | undefined;

  constructor() {
    const prompt = getInlineReviewPrompt();

    this.commentController.options = {
      prompt,
      placeHolder: prompt,
    };
  }

  dispose() {
    this.dismissActive();
    this.commentController.dispose();
  }

  showComposer(hunk: DiffHunk) {
    const thread = this.ensureThread(hunk);

    thread.range = new vscode.Range(getThreadAnchorLine(hunk), 0, getThreadAnchorLine(hunk), 0);
    thread.comments = [];
    thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;
    thread.canReply = true;
    thread.contextValue = undefined;
    thread.label = undefined;
    thread.state = vscode.CommentThreadState.Unresolved;
  }

  dismissActive(): boolean {
    if (!this.activeThread) {
      return false;
    }

    this.activeThread.thread.dispose();
    this.activeThread = undefined;
    return true;
  }

  dismissForHunk(hunkId?: string): boolean {
    if (!this.activeThread) {
      return false;
    }

    if (hunkId && this.activeThread.hunkId !== hunkId) {
      return false;
    }

    return this.dismissActive();
  }

  private ensureThread(hunk: DiffHunk): vscode.CommentThread {
    const modifiedUri = hunk.modifiedUri;

    if (
      this.activeThread &&
      this.activeThread.hunkId === hunk.id &&
      this.activeThread.modifiedUri === modifiedUri
    ) {
      return this.activeThread.thread;
    }

    this.dismissActive();

    const thread = this.commentController.createCommentThread(
      vscode.Uri.parse(modifiedUri),
      new vscode.Range(getThreadAnchorLine(hunk), 0, getThreadAnchorLine(hunk), 0),
      [],
    );

    this.activeThread = {
      hunkId: hunk.id,
      modifiedUri,
      thread,
    };

    return thread;
  }
}
