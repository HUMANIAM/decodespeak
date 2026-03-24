export interface DecodeSpeakSidebarState {
  activeFileLabel: string;
  editorModeLabel: string;
  guidance: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderDecodeSpeakSidebarHtml(
  state: DecodeSpeakSidebarState,
  cspSource: string,
  nonce: string,
): string {
  const activeFileLabel = escapeHtml(state.activeFileLabel);
  const editorModeLabel = escapeHtml(state.editorModeLabel);
  const guidance = escapeHtml(state.guidance);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; img-src ${cspSource} data:; script-src 'nonce-${nonce}';"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DecodeSpeak</title>
    <style>
      :root {
        color-scheme: light dark;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background: var(--vscode-sideBar-background);
      }

      .shell {
        display: grid;
        gap: 16px;
        min-height: 100vh;
        padding: 16px;
      }

      .hero {
        display: grid;
        gap: 8px;
      }

      .eyebrow {
        margin: 0;
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .title {
        margin: 0;
        font-size: 22px;
        line-height: 1.15;
      }

      .lede {
        margin: 0;
        color: var(--vscode-descriptionForeground);
        line-height: 1.5;
      }

      .card {
        display: grid;
        gap: 8px;
        padding: 14px;
        border: 1px solid var(--vscode-widget-border);
        border-radius: 14px;
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--vscode-sideBar-background) 84%, white 16%), var(--vscode-sideBar-background));
      }

      .label {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .active-file {
        font-size: 15px;
        font-weight: 700;
        line-height: 1.4;
        word-break: break-word;
      }

      .mode {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        padding: 4px 10px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--vscode-button-background) 18%, transparent);
        color: var(--vscode-button-foreground);
        font-size: 12px;
        font-weight: 600;
      }

      .guidance {
        margin: 0;
        color: var(--vscode-descriptionForeground);
        line-height: 1.45;
      }

      .actions {
        display: grid;
        gap: 10px;
      }

      button {
        width: 100%;
        padding: 11px 14px;
        border: 1px solid transparent;
        border-radius: 12px;
        font: inherit;
        cursor: pointer;
        transition: transform 120ms ease, opacity 120ms ease, border-color 120ms ease;
      }

      button:hover {
        transform: translateY(-1px);
      }

      .primary {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
      }

      .primary:hover {
        background: var(--vscode-button-hoverBackground);
      }

      .secondary {
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
      }

      .secondary:hover {
        background: var(--vscode-button-secondaryHoverBackground);
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero" aria-label="DecodeSpeak sidebar">
        <p class="eyebrow">DecodeSpeak</p>
        <h1 class="title">Diff review sidebar</h1>
        <p class="lede">This panel is the flexible surface for the richer DecodeSpeak review UI.</p>
      </section>

      <section class="card" aria-label="Current context">
        <div class="label">Current context</div>
        <div class="active-file">${activeFileLabel}</div>
        <div class="mode">${editorModeLabel}</div>
        <p class="guidance">${guidance}</p>
      </section>

      <section class="actions" aria-label="Sidebar actions">
        <button class="primary" type="button" data-action="decode">Decode active hunk</button>
        <button class="secondary" type="button" data-action="settings">Open DecodeSpeak settings</button>
      </section>
    </main>

    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();

      for (const button of document.querySelectorAll("button[data-action]")) {
        button.addEventListener("click", () => {
          vscode.postMessage({ type: button.dataset.action });
        });
      }
    </script>
  </body>
</html>`;
}
