import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCspConnectSources } from "./csp-config.mjs";

export function withInlineScriptHashes(html) {
  const hashes = new Set();
  const scriptTag = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;

  for (const match of html.matchAll(scriptTag)) {
    const attributes = match[1] ?? "";
    const contents = match[2] ?? "";
    if (/\bsrc\s*=/i.test(attributes) || !contents.trim()) continue;
    const digest = createHash("sha256").update(contents, "utf8").digest("base64");
    hashes.add(`'sha256-${digest}'`);
  }

  const cspContent = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https://*.walletconnect.com https://*.walletconnect.org",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' ${getCspConnectSources(process.env).join(" ")}`,
    "frame-src 'self' https://verify.walletconnect.com",
    `script-src 'self' ${[...hashes].join(" ")}`,
  ].join("; ");
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${cspContent.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}">`;
  const headTag = /<head\b[^>]*>/i;
  if (!headTag.test(html)) {
    throw new Error("Could not find the document head for the CSP meta tag.");
  }
  return html.replace(headTag, (head) => `${head}${cspMeta}`);
}

async function visitHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await visitHtml(fullPath)));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(fullPath);
  }
  return files;
}

export async function applyCspToExport(directory = "out") {
  if (process.env.NEXT_PUBLIC_DISABLE_CSP === "1") return;

  const htmlFiles = await visitHtml(directory);
  if (htmlFiles.length === 0) {
    throw new Error(`No exported HTML files found in ${directory}.`);
  }

  // Static fixtures copied into the export are not Next pages and need no CSP.
  let stamped = 0;
  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    if (!html.includes("/_next/static/")) continue;
    await writeFile(file, withInlineScriptHashes(html));
    stamped += 1;
  }
  if (stamped === 0) {
    throw new Error("No Next.js exported pages found to apply the CSP.");
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await applyCspToExport();
}
