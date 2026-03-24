# AI-Augmented Diff Review (VS Code Extension)

## Overview

This extension enhances the code review experience in VS Code diff editors by reducing cognitive load through:

- Inline natural language explanations of code changes
- Per-diff-hunk actions (Explain, Revert, Toggle English)

The goal is to help engineers understand *what a change does* without fully reconstructing behavior from raw code.

---

## Problem

When reviewing diffs, engineers must:

- Infer behavior from raw code changes
- Mentally simulate execution
- Understand intent across multiple lines

Diffs show *what changed*, but not:
- Why it changed
- What it does
- Whether it is safe

This increases review time and cognitive load.

---

## Solution

Augment diff hunks with:

### 1. Per-hunk actions

Each changed block exposes:

- `Explain` → Generate natural language explanation
- `Toggle English` → Switch between code and explanation
- `Revert` → Discard change (via existing VS Code/Git command)

---

### 2. Inline explanation rendering

When triggered:

- Show structured explanation below or instead of the code block
- Keep original code accessible (toggle)

---

### 3. View modes

Each hunk maintains state:

```ts
enum ViewMode {
  CODE,
  EXPLANATION
}
```

---

## Functional Requirements

### Hunk Detection

- Detect changed regions in:
  - `vscode.DiffEditor`
  - Git diff views

---

### User Interaction Flow

#### Explain

1. Extract code from diff hunk
2. Send to LLM
3. Cache response
4. Render explanation inline

#### Toggle

- Switch between:
  - raw code
  - explanation

#### Revert

- Use existing VS Code command to discard changes

---

## Technical Constraints

- VS Code does not allow arbitrary DOM injection inside editor
- Cannot place true floating UI inside diff blocks
- Must use extension APIs (CodeLens, decorations, hovers)

---

## Implementation Approach

### 1. UI Layer

Use:

- **CodeLens** (preferred for MVP)
- or editor decorations + hover

Example:

```
Explain | Toggle English
```

---

### 2. State Management

Per hunk:

```ts
type HunkState = {
  hunkId: string;
  explanation?: string;
  viewMode: "code" | "explanation";
};
```

---

### 3. Rendering Strategy

Options:

#### A. Inline (MVP)
- Show explanation below code using decorations

#### B. Side Panel
- Show explanation in a webview panel

#### C. Replace Code (Advanced)
- Hide code and render explanation in place

---

### 4. Code Extraction

- Extract added/modified lines (`+`)
- Optionally include surrounding context

---

### 5. LLM Integration

Prompt example:

```
Explain this code change in simple terms for a software engineer:

<code>
```

Output:
- concise
- structured
- no fluff

---

## MVP Scope

- Works on open diff editors
- CodeLens above changed hunks:
  - Explain
  - Toggle English
- Clicking Explain:
  - shows explanation below block
- Toggle:
  - hide/show explanation

---

## Non-Goals

- No deep Git integration
- No full code review automation
- No pixel-perfect UI overlays
- No modification of VS Code core

---

## Challenges

- Mapping UI reliably to diff hunks
- Handling editor updates and re-renders
- Managing state per hunk
- Avoiding UI clutter

---

## Success Criteria

- Reviewer understands change faster
- Less need to read full code block
- Minimal disruption to normal workflow

---

## Suggested Iteration Plan

### Phase 1
- Selection-based explanation (simplest)

### Phase 2
- Hunk-aware CodeLens actions

### Phase 3
- Inline explanation rendering

### Phase 4
- Advanced UI (toggle, replace, caching)

---

## Notes

Focus on reducing cognitive load, not adding UI complexity.

The value is:
> faster understanding, not better visuals
