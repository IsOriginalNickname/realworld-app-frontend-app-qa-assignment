#!/usr/bin/env npx ts-node
/**
 * mutation-runner.ts — verify that tests are alive
 * Applies mutations to each test individually → runs only that test via --grep
 * If the test does NOT fail, the mutation survived — the test is useless
 */

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import * as path from "path";

const filepath = process.argv[2];

if (!filepath || (!filepath.includes(".spec.ts") && !filepath.includes(".test.ts"))) {
  process.exit(0);
}

const original = readFileSync(filepath, "utf-8");
const filename = path.basename(filepath);

const RESET  = "\x1b[0m";
const RED    = "\x1b[31m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD   = "\x1b[1m";
const DIM    = "\x1b[2m";

interface Mutation {
  name: string;
  description: string;
  apply: (code: string) => string;
}

const MUTATIONS: Mutation[] = [
  {
    name: "status_code_off_by_one",
    description: "Status code ±1 (201→202, 200→201)",
    apply: (code) =>
      code.replace(
        /expect\(res\.status\(\)\)\.toBe\((\d+)\)/,
        (_, n) => `expect(res.status()).toBe(${parseInt(n) + 1})`
      ),
  },
  {
    name: "wrong_status_code",
    description: "Status code replaced with 999",
    apply: (code) =>
      code.replace(
        /expect\(res\.status\(\)\)\.toBe\(\d+\)/,
        "expect(res.status()).toBe(999)"
      ),
  },
  {
    name: "null_payload",
    description: "Payload replaced with null",
    apply: (code) =>
      code.replace(
        /data:\s*\{[^}]+\}/,
        "data: null"
      ),
  },
  {
    name: "broken_url",
    description: "URL broken (_MUTANT suffix)",
    apply: (code) =>
      code.replace(
        /(https?:\/\/[^\s"'`]+)/,
        "$1_MUTANT"
      ),
  },
  {
    name: "removed_assert",
    description: "First expect() commented out",
    apply: (code) =>
      code.replace(
        /(\s+)(expect\(.+\)\.\w+\(.+\);)/,
        "$1// MUTANT_REMOVED: $2"
      ),
  },
  {
    name: "immutable_field_mutated",
    description: "Immutable field value changed to 'MUTANT_VALUE'",
    apply: (code) =>
      code.replace(
        /(created_at|readOnly\w*|\.id)\)\.toBe\(['"`][^'"`]+['"`]\)/,
        "$1).toBe('MUTANT_VALUE')"
      ),
  },
];

interface TestBlock {
  name: string;
  body: string;
  start: number;
  end: number;
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

    blocks.push({ name, body: source.slice(blockStart, i), start: blockStart, end: i });
  }

  return blocks;
}

function runTest(file: string, testName: string): boolean {
  try {
    const escaped = testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    execSync(
      `npx playwright test "${file}" --grep "${escaped}" --reporter=dot 2>&1`,
      { stdio: "pipe", timeout: 30000 }
    );
    return false; // test passed — bad (mutation survived)
  } catch {
    return true; // test failed — good (mutation killed)
  }
}

console.log(`\n${BOLD}🧬 Mutation Testing${RESET}: ${filename}\n`);

const blocks = extractTestBlocks(original);

if (blocks.length === 0) {
  console.log(`${YELLOW}No test() blocks found — skipping${RESET}\n`);
  process.exit(0);
}

const killedAll: string[] = [];
const survivedAll: string[] = [];
const skippedAll: string[] = [];

for (const block of blocks) {
  console.log(`\n${BOLD}Test:${RESET} "${block.name}"`);

  for (const mutation of MUTATIONS) {
    const mutatedBody = mutation.apply(block.body);

    if (mutatedBody === block.body) {
      skippedAll.push(`${block.name}::${mutation.name}`);
      console.log(`  ${DIM}⊘ SKIP    ${mutation.name}: mutation didn't apply${RESET}`);
      continue;
    }

    // Splice mutated block back into the full file, keeping everything else intact
    const mutatedFile =
      original.slice(0, block.start) + mutatedBody + original.slice(block.end);
    writeFileSync(filepath, mutatedFile, "utf-8");

    const killed = runTest(filepath, block.name);

    if (killed) {
      killedAll.push(`${block.name}::${mutation.name}`);
      console.log(`  ${GREEN}✅ KILLED  ${RESET}${mutation.name}: ${DIM}${mutation.description}${RESET}`);
    } else {
      survivedAll.push(`${block.name}::${mutation.name}`);
      console.log(`  ${RED}❌ SURVIVED${RESET} ${BOLD}${mutation.name}${RESET}: ${mutation.description}`);
      console.log(`     ${YELLOW}→ Test didn't catch this mutation — strengthen the assert${RESET}`);
    }

    // Always restore original before next iteration
    writeFileSync(filepath, original, "utf-8");
  }
}

const total = killedAll.length + survivedAll.length;
const score = total > 0 ? Math.round((killedAll.length / total) * 100) : 100;

console.log(`\n${"─".repeat(50)}`);
console.log(`${BOLD}Mutation score: ${score >= 90 ? GREEN : RED}${score}%${RESET}`);
console.log(`  Killed:   ${GREEN}${killedAll.length}${RESET}`);
console.log(`  Survived: ${RED}${survivedAll.length}${RESET}`);
console.log(`  Skipped:  ${DIM}${skippedAll.length}${RESET}`);

if (survivedAll.length > 0) {
  console.log(`\n${RED}${BOLD}MUTATION FAIL${RESET}: ${survivedAll.length} mutation(s) survived`);
  const mutations = [...new Set(survivedAll.map(s => s.split("::")[1]))];
  console.log(`${YELLOW}Strengthen assertions for: ${mutations.join(", ")}${RESET}\n`);
  process.exit(1);
}

if (score < 90) {
  console.log(`\n${YELLOW}⚠ Score below 90% — add more checks${RESET}\n`);
  process.exit(1);
}

console.log(`\n${GREEN}${BOLD}✓ Mutation testing passed${RESET}\n`);
process.exit(0);
