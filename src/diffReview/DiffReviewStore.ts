import { ExplanationPayload, HunkState } from "./types";

export class DiffReviewStore {
  private readonly documentState = new Map<string, Map<string, HunkState>>();

  private getDocumentMap(modifiedUri: string): Map<string, HunkState> {
    let state = this.documentState.get(modifiedUri);

    if (!state) {
      state = new Map<string, HunkState>();
      this.documentState.set(modifiedUri, state);
    }

    return state;
  }

  getState(modifiedUri: string, hunkId: string): HunkState | undefined {
    return this.documentState.get(modifiedUri)?.get(hunkId);
  }

  setLoading(modifiedUri: string, hunkId: string): HunkState {
    const nextState: HunkState = {
      hunkId,
      status: "loading"
    };

    this.getDocumentMap(modifiedUri).set(hunkId, nextState);
    return nextState;
  }

  setReady(
    modifiedUri: string,
    hunkId: string,
    explanation: ExplanationPayload,
  ): HunkState {
    const nextState: HunkState = {
      hunkId,
      status: "ready",
      explanation
    };

    this.getDocumentMap(modifiedUri).set(hunkId, nextState);
    return nextState;
  }

  setError(modifiedUri: string, hunkId: string, error: string): HunkState {
    const nextState: HunkState = {
      hunkId,
      status: "error",
      error
    };

    this.getDocumentMap(modifiedUri).set(hunkId, nextState);
    return nextState;
  }
}
