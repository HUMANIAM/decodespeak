# Contributing to DecodeSpeak

Thanks for contributing.

## Development setup

```bash
npm install
npm run build
npm run test
```

## Running the extension

The cleanest way to test the extension is to launch a dedicated Extension Development Host:

```bash
code --new-window \
  --extensionDevelopmentPath="$PWD" \
  "$PWD"
```

To test the diff-review flow quickly:

```bash
code --new-window \
  --extensionDevelopmentPath="$PWD" \
  --diff "$PWD/test-before.js" "$PWD/test-after.js"
```

## Expectations for changes

- Keep changes scoped and easy to review.
- Add or update tests when behavior changes.
- For UI changes, verify the runtime behavior in VS Code, not only TypeScript build output.
- If you touch the diff-review flow, verify both the diff editor path and the sidebar path.

## Pull requests

- Describe the user-facing change clearly.
- Include verification steps you actually ran.
- Prefer small PRs over large mixed changes.
