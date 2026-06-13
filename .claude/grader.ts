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

// Skip non-test files
if (!filepath.includes(".spec.ts") && !filepath.includes(".test.ts")) {
  process.exit(0);
}

const code = readFileSync(filepath, "utf-8");
const filename = path.basename(filepath);

interface Check {
  name: string;
  pattern: RegExp;
  message: string;
}

const checks: Check[] = [
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
    name: "checks_immutable",
    pattern: /readOnly|immutable|created_at|\.id\)\.toBe\(|cannot.*change|readonly/i,
    message: "No immutable/readOnly field check from openapi.json",
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

const failed = checks.filter(c => !c.pattern.test(code));

const RESET  = "\x1b[0m";
const RED    = "\x1b[31m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD   = "\x1b[1m";

if (failed.length > 0) {
  console.error(`\n${RED}${BOLD}🔴 GRADER FAIL${RESET}: ${filename}`);
  console.error(`${YELLOW}Issues found: ${failed.length}/${checks.length}${RESET}\n`);
  failed.forEach(c => {
    console.error(`  ${RED}✗${RESET} ${BOLD}${c.name}${RESET}: ${c.message}`);
  });
  console.error(`\n${YELLOW}→ Fix all issues and rewrite the file in full${RESET}\n`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}${BOLD}🟢 GRADER PASS${RESET}: ${filename}`);
  console.log(`${GREEN}   All ${checks.length} checks passed${RESET}\n`);
  process.exit(0);
}
