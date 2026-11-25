import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { withInlineScriptHashes } from "../scripts/apply-csp.mjs";

describe("static export CSP", () => {
  it("hashes inline scripts and inserts the policy in the document head", () => {
    const inlineScript = "window.ready = true;";
    const html = [
      "<!doctype html><html><head>",
      '<script src="/_next/static/chunk.js"></script>',
      `<script>${inlineScript}</script>`,
      "</head><body></body></html>",
    ].join("");
    const digest = createHash("sha256").update(inlineScript).digest("base64");
    const result = withInlineScriptHashes(html);

    expect(result).toContain("<head><meta http-equiv=\"Content-Security-Policy\"");
    expect(result).toContain(`'sha256-${digest}'`);
    expect(result).toContain(`<script>${inlineScript}</script>`);
    expect(result).toContain("connect-src 'self'");
  });

  it("does not mutate inline scripts that contain the old CSP placeholder", () => {
    const inlineScript = 'self.__next_f.push([1,"__PAYFLOW_SCRIPT_HASHES__"]);';
    const html = [
      "<!doctype html><html><head></head><body>",
      `<script>${inlineScript}</script>`,
      "</body></html>",
    ].join("");
    const digest = createHash("sha256").update(inlineScript).digest("base64");
    const result = withInlineScriptHashes(html);

    expect(result).toContain(`'sha256-${digest}'`);
    expect(result).toContain(`<script>${inlineScript}</script>`);
  });

  it("fails when an exported document has no head", () => {
    expect(() => withInlineScriptHashes("<html></html>")).toThrow(
      "Could not find the document head for the CSP meta tag.",
    );
  });
});