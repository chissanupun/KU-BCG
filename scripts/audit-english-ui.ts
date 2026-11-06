import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { mockApi } from "../e2e/mock";

// Lists visible UI text that still contains English words, per page, so each one can be translated or allowed.
// Run against a static build: `python3 -m http.server 3101 --directory out` then `npm run audit:english`.
const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3101";
const OUT = process.env.AUDIT_OUT ?? "docs/gates/english-ui/report.md";

const PAGES = [
  ["home", "/"],
  ["learn-overview", "/learn/?h=1&tab=overview"],
  ["learn-map", "/learn/?h=1&tab=map"],
  ["learn-path", "/learn/?h=1&tab=path"],
  ["topic", "/topic/?h=1&p=0&c=0"],
  ["smart-picks", "/smart-picks/"],
  ["progress", "/progress/"],
  ["profile", "/profile/"],
  ["register", "/register/"],
  ["privacy", "/privacy/"],
  ["admin", "/admin/"],
] as const;

// Names that stay in English by design; everything else with a 4+ letter English word is reported.
const ALLOWED = /\b(KU|Phumpanya|KUKR|KU Forest|KU MOOC|Non-Degree|GraphRAG|Google|PDPA|AI)\b/g;
const ENGLISH = /[A-Za-z]{4,}/;

const visibleText = () => {
  const out: string[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = (n.textContent ?? "").replace(/\s+/g, " ").trim();
    const el = n.parentElement;
    if (!text || !el || el.closest("script,style,noscript")) continue;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    out.push(text);
  }
  return out;
};

async function main() {
  const browser = await chromium.launch();
  const sections: string[] = [];
  let total = 0;
  for (const [name, url] of PAGES) {
    const page = await browser.newPage();
    await mockApi(page);
    await page.goto(BASE + url);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    const found = [...new Set((await page.evaluate(visibleText)).filter((t) => ENGLISH.test(t.replace(ALLOWED, ""))))];
    total += found.length;
    sections.push(`## ${name} (${url}) — ${found.length}\n\n${found.map((t) => `- ${t}`).join("\n") || "- none"}\n`);
    await page.close();
  }
  await browser.close();

  const report = `# English UI text audit\n\nBase: ${BASE} · mock API · allowed names: ${ALLOWED.source}\nText that is document content from the mock fixtures also appears; judge each line.\n\nTotal lines: ${total}\n\n${sections.join("\n")}`;
  writeFileSync(OUT, report);
  console.log(report);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
