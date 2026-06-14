#!/usr/bin/env npx ts-node
/**
 * grader.ts is a validator for our Claude-generated tests
 * Runs automatically via PostToolUse hook
 */

import { readFileSync } from "fs";
import * as path from "path";

const filepath = process.argv[2];

if (!filepath) {
  console.error("Usage: grader.ts <path-to-spec-file>");
  process.exit(1);
}

if (!filepath.includes(".spec.ts") && !filepath.includes(".test.ts")) {
  process.exit(0);
}

const code = readFileSync(filepath, "utf-8");
const filename = path.basename(filepath);

const RESET  = "\x1b[0m";
const RED    = "\x1b[31m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD   = "\x1b[1m";

interface Check {
  name: string;
  pattern: RegExp;
  message: string;
}

// Applied to each test() block individually
const perTestChecks: Check[] = [
  {
    name: "has_url",
    pattern: /https?:\/\/[^\s"'`]+/,
    message: "No URL from openapi.json — take from servers[0].url + paths",
  },
  {
    name: "has_http_call",
    pattern: /request\.(get|post|put|delete|patch|head)\s*\(/,
    message: "No HTTP call found (request.get/post/put/delete/patch)",
  },
  {
    name: "has_real_assert",
    pattern: /expect\(.+\)\.(toBe|toEqual|toHaveProperty|toContain|toMatch|toBeGreaterThan|toBeLessThan|toStrictEqual)\(.+\)/,
    message: "No real assertion — forbidden: expect(true) or expect(x).toBeDefined()",
  },
  {
    name: "has_status_assert",
    pattern: /expect\(res\.status\(\)\)\.toBe\(\d+\)/,
    message: "No status code check: expect(res.status()).toBe(NNN)",
  },
  {
    name: "has_tags",
    pattern: /tag:\s*\[[\s\S]*?@\w+[\s\S]*?\]/,
    message: "No tags — minimum required: [@featureName, @positive/@negative]",
  },
  {
    name: "has_annotation_feature",
    pattern: /annotation:\s*\[[\s\S]*?type:\s*['"]feature['"]/,
    message: "No annotation { type: 'feature', description: '...' }",
  },
  {
    name: "has_annotation_type",
    pattern: /annotation:\s*\[[\s\S]*?type:\s*['"]type['"][\s\S]*?description:\s*['"](?:positive|negative)['"]/,
    message: "No annotation { type: 'type', description: 'positive'|'negative' }",
  },
];

// Applied once across the entire file
const fileChecks: Check[] = [
  {
    name: "checks_immutable",
    pattern: /readOnly|immutable|created_at|\.id\)\.toBe\(|cannot.*change|readonly/i,
    message: "No immutable/readOnly field check from openapi.json (required at least once per file)",
  },
];

interface TestBlock {
  name: string;
  body: string;
}

function extractTestBlocks(source: string): TestBlock[] {
  const blocks: TestBlock[] = [];
  const testRegex = /\btest\s*\(/g;
  let match: RegExpExecArray | null;

  while ((match = testRegex.exec(source)) !== null) {
    const blockStart = match.index;
    const afterKeyword = source.slice(match.index + match[0].length);
    const nameMatch = afterKeyword.match(/^['"]([^'"\\]*(?:\\.[^'"\\]*)*)['"]/);
    if (!nameMatch) continue;
    const name = nameMatch[1];

    // Walk forward tracking paren depth, skipping string literals
    let depth = 1;
    let i = match.index + match[0].length;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      if (ch === '"' || ch === "'" || ch === '`') {
        const q = ch;
        i++;
        while (i < source.length && source[i] !== q) {
          if (source[i] === '\\') i++;
          i++;
        }
        i++;
      } else if (ch === '(') {
        depth++;
        i++;
      } else if (ch === ')') {
        depth--;
        i++;
      } else {
        i++;
      }
    }

    blocks.push({ name, body: source.slice(blockStart, i) });
  }

  return blocks;
}

const blocks = extractTestBlocks(code);

if (blocks.length === 0) {
  console.error(`\n${YELLOW}⚠ No test() blocks found in ${filename}${RESET}\n`);
  process.exit(1);
}

let totalFailed = 0;

for (const block of blocks) {
  const failed = perTestChecks.filter(c => !c.pattern.test(block.body));
  if (failed.length > 0) {
    totalFailed += failed.length;
    console.error(`\n${RED}${BOLD}✗ Test:${RESET} "${block.name}"`);
    failed.forEach(c => {
      console.error(`  ${RED}✗${RESET} ${BOLD}${c.name}${RESET}: ${c.message}`);
    });
  }
}

const fileFailedChecks = fileChecks.filter(c => !c.pattern.test(code));
if (fileFailedChecks.length > 0) {
  totalFailed += fileFailedChecks.length;
  console.error(`\n${RED}${BOLD}✗ File-level checks:${RESET}`);
  fileFailedChecks.forEach(c => {
    console.error(`  ${RED}✗${RESET} ${BOLD}${c.name}${RESET}: ${c.message}`);
  });
}

if (totalFailed > 0) {
  console.error(`\n${RED}${BOLD}🔴 GRADER FAIL${RESET}: ${filename}`);
  console.error(`${YELLOW}Issues found across ${blocks.length} test(s) — fix all and rewrite the file in full${RESET}\n`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}${BOLD}🟢 GRADER PASS${RESET}: ${filename}`);
  console.log(`${GREEN}   All checks passed across ${blocks.length} test(s)${RESET}\n`);
  process.exit(0);
}
