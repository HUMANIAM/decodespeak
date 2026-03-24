# Building an AI Diff Assistant (VS Code Extension Strategy)

## Overview

This document outlines how to build an AI-powered diff review assistant in VS Code.

The goal is to augment code diffs with:
- Natural language explanations
- Per-hunk actions (Explain, Toggle, Revert)

---

## Core Question

Can we build on top of an existing diff extension like Codex or GitLens?

### Short Answer

No — not effectively.

Instead, build directly on top of:
👉 VS Code Extension API

---

## Why Not Build on Existing Extensions?

### Codex Extension

- Not open source
- No public API to extend its UI or behavior
- Internals are not accessible

👉 You cannot reliably build on top of it

---

### GitLens

- Open source
- Provides some APIs

BUT:
- Does not control all diff rendering
- VS Code built-in Git + diff editor still handle core behavior

👉 Useful as a helper, not a foundation

---

## Correct Mental Model

VS Code itself is the platform.

Not:
- Codex
- GitLens
- Any other extension

---

## Recommended Architecture

Build a standalone extension using:

### Core APIs

- `vscode.window.visibleTextEditors`
- `vscode.DiffEditor`
- `vscode.commands.executeCommand`
- SCM API (optional)

---

### UI Surfaces

Use:

- CodeLens (for per-hunk actions)
- Decorations (for inline UI)
- Hover (for quick interaction)
- Webview (for advanced rendering)

---

## Feature Mapping

### Explain

- Extract code from diff hunk
- Send to LLM
- Cache response
- Render inline

---

### Toggle English

- Maintain state per hunk
- Switch between:
  - code
  - explanation

---

### Revert

- Use existing VS Code Git commands

---

## Hunk Detection (Hard Part)

Challenges:

- VS Code does not expose diff hunks directly
- Must infer from:
  - document changes
  - decorations
  - SCM data

👉 Start simple:
- selection-based explanation
- then evolve to hunk detection

---

## Implementation Plan

### Phase 1 — Simple

- Explain selected code
- Show result in panel

---

### Phase 2 — Diff-aware

- Detect when editor is diff
- Add CodeLens above changed blocks

---

### Phase 3 — Inline UX

- Render explanation below hunk
- Add toggle

---

### Phase 4 — Advanced

- Replace code with explanation
- Add caching
- Improve UI

---

## LLM Integration

Example prompt:

```
Explain this code change in simple terms for a software engineer:

<code>
```

---

## Key Insight

The hard problem is NOT UI.

The hard problem is:
👉 mapping user actions to correct diff hunks

---

## Recommendation

Start with:
- minimal UI (CodeLens)
- correct data extraction

Then evolve UX.

---

## Summary

- Do NOT build on Codex extension
- Do NOT rely on GitLens as core
- Build directly on VS Code APIs
- Focus on correctness first, UI later

---

## Value

This tool reduces:

- cognitive load during review
- time to understand changes
- mental simulation effort

---

End of document.
