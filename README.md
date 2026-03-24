# DecodeSpeak

DecodeSpeak is a VS Code extension prototype for explaining diff hunks in plain English.

Current MVP:
- detects the active text diff editor
- computes per-hunk CodeLens actions
- exposes a dedicated sidebar view in the Activity Bar
- calls local `codex exec` for explanations
- caches explanations per hunk
- supports `Explain`, `Accept`, and a placeholder `Revert`
- opens a native inline review form instead of a prose explanation card

## Development

```bash
npm install
npm run build
npm run test
```

Launch a dedicated Extension Development Host:

```bash
code --new-window \
  --extensionDevelopmentPath="$PWD" \
  "$PWD"
```
