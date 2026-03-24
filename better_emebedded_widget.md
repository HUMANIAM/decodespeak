# Better Embedded Widget Plan

- Keep the hunk trigger row lightweight through `CodeLens`: `Explain`, `Revert`, and `Accept`.
- Remove the generated prose explanation block from the inline widget.
- On `Explain`, open the native VS Code comment composer so the widget matches the built-in review form style.
- Reuse the native `Cancel` and `Comment` controls instead of rendering custom markdown links in the thread body.
- Keep only one review widget open at a time to avoid stacking multiple inline panels.
- Make `Accept` dismiss the open review widget without changing code.
- Leave `Revert` as a placeholder in this pass.
- Verify with tests, a VS Code dev-host run, and screenshot inspection of the diff UI.
