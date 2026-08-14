import fs from "node:fs";
import path from "node:path";
import { rulesPath, readLatestRules, rulesVersion, extractPrinciples } from "../src/core.js";

// eight-rules: reuse 沿用原 expected 清单机制,仅对齐 v3.3.0 真实标题(旧 "寻求确认"→"多方验证"、"人类确认"→"沟通确认"、"主动验证"→"主动调试")
const expected = ["认真查阅", "多方验证", "沟通确认", "诚实无知", "确认后行", "系统穷尽", "数学验证", "复述前必验证", "尊重用户成果", "创造性解决问题", "复用现有", "主动调试", "遵循规范", "谨慎重构", "坚持完整版", "超越平凡", "通俗易懂", "节约 token", "可靠流程", "备份先行", "回收站删除", "帮助用户解决困难", "立即但完整", "联系全文", "协助用户完成挑战", "核心价值观"];
const CN_TENS = { 十: 10, 二十: 20, 三十: 30, 四十: 40 };
const CN_ONES = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
function cnToNum(raw = "") { const m = /^([一二三四]?十)?([一二三四五六七八九])?$/.exec(String(raw).trim()); if (!m) return NaN; return (m[1] ? CN_TENS[m[1]] ?? 10 : 0) + (m[2] ? CN_ONES[m[2]] : 0) || NaN; }

const text = readLatestRules();
const principles = extractPrinciples(text);
const missing = expected.filter((title) => !text.includes(title));

// eight-rules: boundary 条数只允许一个来源(principles.length);package.json 描述与 RULES.md 章节标题必须与之相等,否则视为漂移(踩坑 7)
const pkg = JSON.parse(fs.readFileSync(path.resolve(rulesPath, "..", "package.json"), "utf8"));
const pkgCount = Number((/(\d+)\s*条准则/.exec(pkg.description || "") || [])[1]);
const headingCn = (/^##\s*[^\n]*?、([一二三四五六七八九十]+)条准则/m.exec(text) || [])[1];
const headingCount = cnToNum(headingCn);
const countDrift = [];
if (pkgCount !== principles.length) countDrift.push(`package.json description ${pkgCount} != ${principles.length}`);
if (headingCount !== principles.length) countDrift.push(`RULES.md 章节标题 "${headingCn}"(${headingCount}) != ${principles.length}`);

// eight-rules: boundary README 双语版的条数声明也必须对齐(踩坑 7 根治:不只补 package.json)
for (const [name, re] of [["README.md", /(\d+)\s*条准则/g], ["README_EN.md", /(\d+)\s*principles/g]]) {
  let body = "";
  try { body = fs.readFileSync(path.resolve(rulesPath, "..", name), "utf8"); } catch { countDrift.push(`${name} 读取失败`); continue; }
  const nums = [...body.matchAll(re)].map((m) => Number(m[1]));
  if (!nums.length) { countDrift.push(`${name} 未声明条数`); continue; }
  const bad = [...new Set(nums.filter((n) => n !== principles.length))];
  if (bad.length) countDrift.push(`${name} 条数 ${bad.join("/")} != ${principles.length}`);
}

if (!text || principles.length < 26 || missing.length || countDrift.length) {
  console.error(JSON.stringify({ rulesPath, version: rulesVersion(text), missing, countDrift, principleCount: principles.length }, null, 2));
  process.exit(1);
}
console.log(`latest rules checks passed: ${principles.length} principles from ${rulesPath} (package.json + 章节标题条数已对齐)`);
