import { spawnSync } from "node:child_process";
const result = spawnSync(process.execPath, ["--test", "tests/core.test.js"], { stdio: "inherit" });
if (result.status !== 0) { console.error("quality gates failed"); process.exit(result.status || 1); }
console.log("quality gates passed");
