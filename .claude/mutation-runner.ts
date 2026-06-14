#!/usr/bin/env npx ts-node
/**
 * mutation-runner.ts — проверяем что тесты живые
 * Применяем мутации к тесту → запускаем → если тест НЕ упал, он бесполезен
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
    description: "Статус-код ±1 (201→202, 200→201)",
    apply: (code) =>
      code.replace(
        /expect\(res\.status\(\)\)\.toBe\((\d+)\)/,
        (_, n) => `expect(res.status()).toBe(${parseInt(n) + 1})`
      ),
  },
  {
    name: "wrong_status_code",
    description: "Статус-код заменён на 999",
    apply: (code) =>
      code.replace(
        /expect\(res\.status\(\)\)\.toBe\(\d+\)/,
        "expect(res.status()).toBe(999)"
      ),
  },
  {
    name: "null_payload",
    description: "Payload заменён на null",
    apply: (code) =>
      code.replace(
        /data:\s*\{[^}]+\}/,
        "data: null"
      ),
  },
  {
    name: "broken_url",
    description: "URL сломан (_MUTANT суффикс)",
    apply: (code) =>
      code.replace(
        /(https?:\/\/[^\s"'`]+)/,
        "$1_MUTANT"
      ),
  },
  {
    name: "removed_assert",
    description: "Первый expect() закомментирован",
    apply: (code) =>
      code.replace(
        /(\s+)(expect\(.+\)\.\w+\(.+\);)/,
        "$1// MUTANT_REMOVED: $2"
      ),
  },
  {
    name: "immutable_field_mutated",
    description: "Значение immutable поля изменено на 'MUTANT_VALUE'",
    apply: (code) =>
      code.replace(
        /(created_at|readOnly\w*|\.id)\)\.toBe\(['"`][^'"`]+['"`]\)/,
        "$1).toBe('MUTANT_VALUE')"
      ),
  },
];

function runTest(file: string): boolean {
  try {
    execSync(
      `npx playwright test "${file}" --reporter=dot 2>&1`,
      { stdio: "pipe", timeout: 30000 }
    );
    return false; // тест прошёл — плохо (мутация выжила)
  } catch {
    return true; // тест упал — хорошо (мутация убита)
  }
}

console.log(`\n${BOLD}🧬 Mutation Testing${RESET}: ${filename}\n`);

const killed: string[] = [];
const survived: string[] = [];
const skipped: string[] = [];

for (const mutation of MUTATIONS) {
  const mutated = mutation.apply(original);

  if (mutated === original) {
    skipped.push(mutation.name);
    console.log(`  ${DIM}⊘ SKIP    ${mutation.name}: мутация не применилась${RESET}`);
    continue;
  }

  // Записываем мутанта
  writeFileSync(filepath, mutated, "utf-8");

  const testFailed = runTest(filepath);

  if (testFailed) {
    killed.push(mutation.name);
    console.log(`  ${GREEN}✅ KILLED  ${RESET}${mutation.name}: ${DIM}${mutation.description}${RESET}`);
  } else {
    survived.push(mutation.name);
    console.log(`  ${RED}❌ SURVIVED${RESET} ${BOLD}${mutation.name}${RESET}: ${mutation.description}`);
    console.log(`     ${YELLOW}→ Тест не поймал эту мутацию — усиль assert${RESET}`);
  }

  // Восстанавливаем оригинал
  writeFileSync(filepath, original, "utf-8");
}

// Итог
const total = killed.length + survived.length;
const score = total > 0 ? Math.round((killed.length / total) * 100) : 100;

console.log(`\n${"─".repeat(50)}`);
console.log(`${BOLD}Mutation score: ${score >= 90 ? GREEN : RED}${score}%${RESET}`);
console.log(`  Killed:   ${GREEN}${killed.length}${RESET}`);
console.log(`  Survived: ${RED}${survived.length}${RESET}`);
console.log(`  Skipped:  ${DIM}${skipped.length}${RESET}`);

if (survived.length > 0) {
  console.log(`\n${RED}${BOLD}MUTATION FAIL${RESET}: ${survived.length} мутаций выжило`);
  console.log(`${YELLOW}Усиль assertions для: ${survived.join(", ")}${RESET}\n`);
  process.exit(1);
}

if (score < 90) {
  console.log(`\n${YELLOW}⚠ Score ниже 90% — нужно больше проверок${RESET}\n`);
  process.exit(1);
}

console.log(`\n${GREEN}${BOLD}✓ Mutation testing passed${RESET}\n`);
process.exit(0);
