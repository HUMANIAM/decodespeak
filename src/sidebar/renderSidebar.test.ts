import { describe, expect, it } from "vitest";

import { renderDecodeSpeakSidebarHtml } from "./renderSidebar";

describe("renderDecodeSpeakSidebarHtml", () => {
  it("renders the sidebar title and actions", () => {
    const html = renderDecodeSpeakSidebarHtml(
      {
        activeFileLabel: "test-after.js",
        editorModeLabel: "Diff editor active",
        guidance: "Select a changed hunk to review it.",
      },
      "vscode-resource:",
      "nonce-123",
    );

    expect(html).toContain("Diff review sidebar");
    expect(html).toContain("Decode active hunk");
    expect(html).toContain("Open DecodeSpeak settings");
    expect(html).toContain("test-after.js");
    expect(html).toContain("Diff editor active");
  });

  it("escapes dynamic values before rendering them", () => {
    const html = renderDecodeSpeakSidebarHtml(
      {
        activeFileLabel: "<unsafe>",
        editorModeLabel: "\"quoted\"",
        guidance: "Use <diff> & review",
      },
      "vscode-resource:",
      "nonce-456",
    );

    expect(html).toContain("&lt;unsafe&gt;");
    expect(html).toContain("&quot;quoted&quot;");
    expect(html).toContain("Use &lt;diff&gt; &amp; review");
  });
});
