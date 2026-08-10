import fs from "node:fs";
import path from "node:path";

export function projectRoot(start = process.cwd()) {
  let current = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(current, ".git")) || fs.existsSync(path.join(current, "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(start);
    current = parent;
  }
}

export function gitOutput(args, cwd = projectRoot()) {
  const { execFileSync } = require("node:child_process");
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

export function changedFiles(cwd = projectRoot()) {
  try { return gitOutput(["status", "--short"], cwd).split(/\r?\n/).filter(Boolean); } catch { return []; }
}

export function diffSummary(cwd = projectRoot()) {
  try { return gitOutput(["diff", "--stat"], cwd).trim(); } catch { return "git diff unavailable"; }
}

export function auditRepository(cwd = projectRoot()) {
  const files = changedFiles(cwd);
  const warnings = [];
  if (files.length && !fs.existsSync(path.join(cwd, "package.json"))) warnings.push("project-manifest-missing");
  if (files.some((file) => /(^|\s)D\s/.test(file))) warnings.push("deletion-detected-confirm-recovery");
  if (files.length && !diffSummary(cwd)) warnings.push("changed-files-without-diff-summary");
  return { cwd, changedFiles: files, diff: diffSummary(cwd), warnings };
}
