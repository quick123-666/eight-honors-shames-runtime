// tests for buildMethodTreeHint() — RULES-TREE 7 段沉淀硬话术核心
// 对标 hooks/eight-rules-hint.test.js ESM 写法(import 而非 require)
// 跑法: node --test hooks/method-tree-hint.test.js
// v3.4.5 修正:内容从 外部工具链 → RULES-TREE 7 段元工作流沉淀

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMethodTreeHint } from "./index.js";

test("off 档返回停用 token(不激活)", () => {
  const hint = buildMethodTreeHint("off");
  assert.match(hint, /方法树已停用/);
  assert.match(hint, /off/);
  assert.doesNotMatch(hint, /NO DRIFT/, "off 档不该说 NO DRIFT");
  assert.doesNotMatch(hint, /已激活/, "off 档不该说 已激活");
});

test("full 档返回激活 + NO DRIFT + 7 段沉淀 + 关闭方式", () => {
  const hint = buildMethodTreeHint("full");
  assert.match(hint, /方法树已激活/);
  assert.match(hint, /full/, "应包含当前档名 full");
  assert.match(hint, /RULES-TREE/, "应指向 RULES-TREE 沉淀池");
  assert.match(hint, /7 段/, "应指明 7 段格式");
  assert.match(hint, /NO DRIFT/, "应包含反漂移硬话术 NO DRIFT");
  assert.match(hint, /失守|自问|沉淀/, "full 档应引导 AI 失守/自问/沉淀");
});

test("lite 档显示 lite 档名", () => {
  const hint = buildMethodTreeHint("lite");
  assert.match(hint, /lite/, "应包含 lite");
  assert.match(hint, /方法树已激活/);
});

test("ultra 档显示 ultra 档名 + 强制指令", () => {
  const hint = buildMethodTreeHint("ultra");
  assert.match(hint, /ultra/, "应包含 ultra");
  assert.match(hint, /方法树已激活/);
  assert.match(hint, /强制|每任务/, "ultra 档应强调强制沉淀");
});

test("包含 3 种关闭方式(对标 eight-rules 的 '停止 / no mr / /mr off')", () => {
  const hint = buildMethodTreeHint("full");
  assert.match(hint, /停止方法树/, "中文停止指令");
  assert.match(hint, /no mr/, "英文 no mr");
  assert.match(hint, /\/mr off/, "命令 /mr off");
});

test("包含 4 档换档枚举(lite/full/ultra/off)", () => {
  const hint = buildMethodTreeHint("full");
  assert.match(hint, /lite/, "含 lite");
  assert.match(hint, /full/, "含 full");
  assert.match(hint, /ultra/, "含 ultra");
  assert.match(hint, /off/, "含 off");
});

test("默认档兜底:传入未知档名也按已激活处理(防御)", () => {
  const hintUnknown = buildMethodTreeHint("experimental");
  assert.match(hintUnknown, /方法树已激活/, "未知档也应是已激活");
  assert.match(hintUnknown, /experimental/, "应保留原档名供调试");
});
