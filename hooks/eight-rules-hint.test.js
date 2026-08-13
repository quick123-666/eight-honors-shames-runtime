// tests for buildEightRulesHint() — 反漂移硬话术核心
// 对标 Ponytail hooks/test 反向守护
// 跑法: node --test hooks/eight-rules-hint.test.js
// 集成: 加进 package.json "test": "node --test hooks/*.test.js && ..."

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildEightRulesHint } from "./index.js";

test("off 档返回停用 token(不激活)", () => {
  const hint = buildEightRulesHint("off");
  assert.match(hint, /八荣八耻已停用/);
  assert.match(hint, /off/);
  assert.doesNotMatch(hint, /NO DRIFT/, "off 档不该说 NO DRIFT");
  assert.doesNotMatch(hint, /已激活/, "off 档不该说 已激活");
});

test("full 档返回激活 + 28条 + NO DRIFT + 关闭方式", () => {
  const hint = buildEightRulesHint("full");
  assert.match(hint, /八荣八耻已激活/);
  assert.match(hint, /full/, "应包含当前档名 full");
  assert.match(hint, /28条/, "应包含 28 条");
  assert.match(hint, /NO DRIFT/, "应包含反漂移硬话术 NO DRIFT");
  assert.match(hint, /Still active if unsure/, "应包含 Ponytail 同款话术");
});

test("lite 档显示 lite 档名", () => {
  const hint = buildEightRulesHint("lite");
  assert.match(hint, /lite/, "应包含 lite");
  assert.match(hint, /八荣八耻已激活/);
});

test("ultra 档显示 ultra 档名", () => {
  const hint = buildEightRulesHint("ultra");
  assert.match(hint, /ultra/, "应包含 ultra");
  assert.match(hint, /八荣八耻已激活/);
});

test("包含 3 种关闭方式(对标 Ponytail 'stop ponytail / normal mode / off')", () => {
  const hint = buildEightRulesHint("full");
  assert.match(hint, /停止八荣八耻/, "中文停止指令");
  assert.match(hint, /normal mode/, "英文 normal mode");
  assert.match(hint, /\/rules off/, "命令 /rules off");
});

test("包含 4 档换档枚举(lite/full/ultra/off)", () => {
  const hint = buildEightRulesHint("full");
  assert.match(hint, /lite/, "含 lite");
  assert.match(hint, /full/, "含 full");
  assert.match(hint, /ultra/, "含 ultra");
  assert.match(hint, /off/, "含 off");
});

test("默认档兜底:传入未知档名按 full 处理(防御)", () => {
  // 不传参或传未知档 — 文档没禁止,但防御式编程
  const hintUnknown = buildEightRulesHint("experimental");
  assert.match(hintUnknown, /八荣八耻已激活/, "未知档也应是已激活");
  assert.match(hintUnknown, /experimental/, "应保留原档名供调试");
});