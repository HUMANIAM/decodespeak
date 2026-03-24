# Building an AI Diff Assistant on Top of Continue (VS Code Extension Strategy)

## Overview

This document defines a practical strategy for building an experimental AI-powered diff review assistant in VS Code, using **Continue** as the starting point rather than building directly on Codex or GitLens.

The goal is to augment code diffs with:

- Natural language explanations of code changes
- Per-hunk actions such as **Explain**, **Toggle English**, and later **Revert**
- A lightweight review workflow that reduces cognitive load

---

## Why Continue

We choose **Continue** because it is an open-source VS Code extension and is already designed around AI interactions inside the editor. Continue’s public repository includes a VS Code extension, and its official docs describe installation and usage inside VS Code. The current GitHub releases also show VS Code extension releases, including `v1.3.33-vscode` published on March 13, 2026. citeturn583696search0turn583696search5turn583696search6

### Why this is a better base than the alternatives

#### Continue
- Open source
- Already built for AI-assisted workflows inside VS Code
- Good fit for explanation-oriented features
- Easier foundation for experimentation than a Git-heavy extension

#### GitLens
- Open source and valuable as a reference
- Strong on Git history and annotations
- Less suitable as the primary base for an experimental AI diff explainer

#### Codex extension
- Not the right foundation for direct extension-level hacking here
- Higher uncertainty around whether its internal UI is the right thing to build on
- Worse choice for fast experimentation than Continue

---

## Problem

When reviewing diffs, engineers must:

- infer behavior from raw code changes
- mentally reconstruct intent
- simulate edge cases and execution in their head

Diffs show **what changed**, but not:

- why it changed
- what the change does at a higher level
- what assumptions or risks it introduces

This increases review time and mental effort.

---

## Proposed Solution

Augment the diff review experience with:

### 1. Per-hunk AI actions

For each changed block, provide actions such as:

- `Explain`
- `Toggle English`
- later: `Revert`

### 2. Inline or near-inline explanation

When the user triggers **Explain**:

- extract the code for the selected or detected diff hunk
- send it to an LLM
- render a concise explanation near the code

### 3. Per-hunk local state

Each diff hunk should maintain state such as:

```ts
type HunkState = {
  hunkId: string;
  explanation?: string;
  viewMode: "code" | "explanation";
};
```

---

## Important Constraint

The hard part is **not** calling an LLM.

The hard part is:

> correctly mapping editor interaction to the right diff hunk and rendering useful UI without fighting the editor

That is why this should start as an experiment with a narrow scope.

---

## Recommended Experimental Scope

### Phase 1 — Selection-based explanation

Start with the smallest working version:

- user selects code inside a diff
- command: `Explain Selected Change`
- result appears in Continue-style UI or a simple panel

This avoids difficult hunk detection early.

### Phase 2 — Diff-aware actions

Then add:

- detection that the current editor is a diff view
- hunk-level commands using CodeLens or decorations
- explanation caching

### Phase 3 — Toggle experience

Add:

- `Toggle English`
- switch between raw code and explanation
- explanation shown below or beside the changed block

### Phase 4 — Richer review flow

Later:

- risk summary
- assumptions summary
- "what changed semantically"
- possible revert integration

---

## Implementation Strategy

### A. Use Continue as the AI/workflow base

Leverage Continue for:

- model interaction
- prompt execution
- editor integration patterns
- UI patterns already familiar to users of Continue

### B. Add a diff-focused feature layer

Build a feature that is specifically about diff explanation:

- extract code from selected range or diff hunk
- generate explanation optimized for software engineers
- attach output to the review context

### C. Keep the first UI simple

Do **not** start with floating buttons inside the green diff block.

Start with:

- command palette action
- CodeLens above changed code
- hover or panel rendering

That is easier to ship and easier to validate.

---

## UI Recommendation for MVP

### Preferred surfaces

Use one of these first:

- **CodeLens**
- **hover**
- **side panel**
- **simple inline decoration**

### Avoid initially

- pixel-perfect overlay widgets inside diff blocks
- replacing VS Code core diff rendering
- deep DOM hacks

These make the experiment brittle too early.

---

## Functional Flow

### Explain flow

1. User selects code or triggers explanation from a changed region
2. Extension extracts the code
3. Prompt is sent to the LLM
4. Result is cached
5. Explanation is rendered near the code

### Toggle flow

1. User triggers `Toggle English`
2. Extension switches local state
3. UI shows either:
   - original code
   - natural language explanation

---

## Prompt Shape

A good first prompt:

```text
Explain this code change in plain English for a software engineer reviewing a diff.

Focus on:
- what changed
- what behavior it introduces
- any assumptions or risks

Keep it concise and concrete.

<code>
```

---

## Non-goals

This experiment is **not** trying to:

- replace the full code review process
- modify VS Code’s core diff renderer
- deeply integrate with Git history at first
- produce perfect per-hunk UI from day one

---

## Success Criteria

The experiment is successful if:

- a reviewer understands a diff faster
- the explanation helps without being noisy
- the workflow feels lighter than reading everything line by line
- the system works on real diffs without too much UI friction

---

## Practical Recommendation

Use **Continue** as the base if the main value is AI explanation.

Do **not** optimize for perfect diff UI first.

Optimize for this instead:

> can a reviewer click once and understand the changed block faster?

If yes, the experiment is working.

---

## References

- Continue GitHub repository: open-source project with VS Code extension in the repo. citeturn583696search0
- Continue install docs for VS Code. citeturn583696search5
- Continue Visual Studio Marketplace listing for the VS Code extension. citeturn583696search3
- Continue releases page showing recent VS Code extension releases. citeturn583696search6
