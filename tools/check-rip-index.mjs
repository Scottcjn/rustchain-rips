// SPDX-License-Identifier: MIT
// Guards the maintenance note at the top of rip-search.js: the static index the
// search page renders must match the Current RIP Index table in README.md.
// Run with: node tools/check-rip-index.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readmeIndex() {
  const rows = [];
  for (const line of fs.readFileSync(path.join(root, "README.md"), "utf8").split("\n")) {
    // | [0310](href) | Title | Status | Source |
    const m = line.match(/^\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|\s*$/);
    if (!m) continue;
    rows.push({
      number: m[1].trim(),
      href: m[2].trim(),
      title: m[3].trim(),
      status: m[4].trim(),
      source: m[5].trim(),
    });
  }
  return rows;
}

function searchPageIndex() {
  // rip-search.js is a browser script: give it just enough DOM to load.
  const stub = () => ({
    value: "",
    hidden: false,
    textContent: "",
    dataset: {},
    appendChild() {},
    append() {},
    replaceChildren() {},
    addEventListener() {},
  });
  const context = vm.createContext({ document: { getElementById: stub, createElement: stub } });
  const source = fs.readFileSync(path.join(root, "rip-search.js"), "utf8");
  vm.runInContext(`${source}\nglobalThis.__RIP_INDEX = RIP_INDEX;`, context);
  return context.__RIP_INDEX;
}

const readme = readmeIndex();
const page = searchPageIndex();

if (readme.length === 0) {
  console.error("check-rip-index: no RIP rows found in README.md — has the table format changed?");
  process.exit(1);
}

const problems = [];
const pageByNumber = new Map(page.map((rip) => [rip.number, rip]));

for (const row of readme) {
  const rip = pageByNumber.get(row.number);
  if (!rip) {
    problems.push(`RIP-${row.number} ("${row.title}") is in README.md but missing from rip-search.js`);
    continue;
  }
  for (const field of ["title", "status", "source", "href"]) {
    if (rip[field] !== row[field]) {
      problems.push(`RIP-${row.number} ${field}: README has "${row[field]}", rip-search.js has "${rip[field]}"`);
    }
  }
}

const readmeNumbers = new Set(readme.map((row) => row.number));
for (const rip of page) {
  if (!readmeNumbers.has(rip.number)) {
    problems.push(`RIP-${rip.number} ("${rip.title}") is in rip-search.js but missing from README.md`);
  }
}

if (problems.length > 0) {
  console.error("check-rip-index: the search index and README.md disagree:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("\nUpdate both in the same PR (see the note at the top of rip-search.js).");
  process.exit(1);
}

console.log(`check-rip-index: OK — ${page.length} RIPs, README.md and rip-search.js agree.`);
