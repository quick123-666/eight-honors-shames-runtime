//! 安装配置测试:验证 build-adapters 生成的各工具适配文件
//! 1. 7 个工具目标齐全
//! 2. 每个文件包含 21 条精简命令式(与 AGENTS.md 零漂移)
//! 3. 每个文件指向 RULES.md(单一来源,不复制完整正文)
//! 4. 无敏感内容(个人路径/密钥/内部工具)
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAdapters, extractPrinciples, ADAPTER_TARGETS } from "../scripts/build-adapters.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "adapters-test-"));

test("生成 7 个工具适配文件", () => {
  const written = buildAdapters({ root: ROOT, out: tmp });
  const names = written.map((f) => path.basename(f)).sort();
  const expected = Object.keys(ADAPTER_TARGETS).sort();
  assert.deepEqual(names, expected);
});

test("每个适配文件与 AGENTS.md 的 21 条零漂移", () => {
  const source = extractPrinciples(path.join(ROOT, "AGENTS.md"));
  assert.equal(source.length, 21);
  for (const [file] of Object.entries(ADAPTER_TARGETS)) {
    const content = fs.readFileSync(path.join(tmp, file), "utf8");
    for (const p of source) {
      assert.ok(content.includes(`> ${p}`), `${file} 缺第 ${p.split(".")[0]} 条`);
    }
  }
});

test("每个适配文件指向 RULES.md 且不含完整正文", () => {
  const rules = fs.readFileSync(path.join(ROOT, "RULES.md"), "utf8");
  for (const [file] of Object.entries(ADAPTER_TARGETS)) {
    const content = fs.readFileSync(path.join(tmp, file), "utf8");
    assert.ok(content.includes("RULES.md"), `${file} 应指向单一来源 RULES.md`);
    assert.ok(!content.includes("### 准则"), `${file} 不应包含 RULES.md 完整章节`);
    assert.ok(!content.includes("**判断标准**"), `${file} 不应包含完整版细节`);
    assert.ok(content.length < rules.length / 2, `${file} 应显著小于完整版`);
  }
});

test("适配文件无敏感内容", () => {
  const sensitive = /Administrator|jshgd|qclaw|openclaw|mr-llm|lsx-mp-rust|sk-[A-Za-z0-9]{10,}|auth\.json|\.pi\/agent/;
  for (const [file] of Object.entries(ADAPTER_TARGETS)) {
    const content = fs.readFileSync(path.join(tmp, file), "utf8");
    assert.ok(!sensitive.test(content), `${file} 含敏感内容`);
  }
});

test("build-adapters 可写入任意输出目录", () => {
  const outDir = path.join(tmp, "cli-out");
  const written = buildAdapters({ root: ROOT, out: outDir });
  assert.equal(written.length, 7);
  assert.ok(fs.existsSync(path.join(outDir, "CLAUDE.md")));
  assert.ok(fs.existsSync(path.join(outDir, ".cursorrules")));
  assert.ok(fs.existsSync(path.join(outDir, "GEMINI.md")));
});

test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
