# DecodeSpeak

DecodeSpeak is a VS Code extension prototype for explaining diff hunks in plain English.

Current MVP:
- detects the active text diff editor
- computes per-hunk CodeLens actions
- calls local `codex exec` for explanations
- caches explanations per hunk
- supports `Explain`, `Accept`, and a placeholder `Revert`
- opens a native inline review form instead of a prose explanation card

## Development

```bash
npm install
npm run build
```

Open this folder in VS Code and press `F5` to launch the extension host.
