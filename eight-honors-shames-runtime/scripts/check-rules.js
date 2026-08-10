import fs from "node:fs";
import path from "node:path";
import { rulesPath, readLatestRules, rulesVersion, extractPrinciples } from "../src/core.js";

const expected = ["认真查阅", "寻求确认", "人类确认", "复用现有", "主动验证", "遵循规范", "诚实无知", "谨慎重构", "确认后行", "备份先行", "回收站删除", "坚持完整版", "超越平凡", "通俗易懂", "节约 token", "协助到底", "系统穷尽", "帮助解难", "数学验证"];
const text = readLatestRules();
const principles = extractPrinciples(text);
const missing = expected.filter((title) => !text.includes(title));
if (!text || principles.length < 19 || missing.length) {
  console.error(JSON.stringify({ rulesPath, version: rulesVersion(text), missing, principleCount: principles.length }, null, 2));
  process.exit(1);
}
console.log(`latest rules checks passed: ${principles.length} principles from ${rulesPath}`);
