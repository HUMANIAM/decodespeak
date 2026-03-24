function getCodeLensActions() {
  return ["Explain", "Revert", "Accept"];
}

function showInlineReviewWidget() {
  return "Shows the English explanation in an inline review thread.";
}

console.log(`${getCodeLensActions().join(" | ")}\n${showInlineReviewWidget()}`);
