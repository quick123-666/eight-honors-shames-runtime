<div align="center">

**English** | [简体中文](./README.md)

# 🎌 Eight Honors & Eight Shames — AI Coding Core Values

### Engineering AI collaboration discipline: single source · injectable · auditable · benchmarkable · acceptable

**21 principles · cross-project core values · 81%+ token saved on rule injection · ready for 8+ AI tools**

[![Version](https://img.shields.io/badge/version-v1.1.1-blue)](./package.json)
[![License](https://img.shields.io/badge/License-MIT-yellow)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-27%20passed-brightgreen)](./tests)
[![Node](https://img.shields.io/badge/node-%3E%3D20-green)](./package.json)
[![AI Tools](https://img.shields.io/badge/AI_Tools-8+-purple)](#installation-which-md-does-each-ai-tool-need)

<br/>

General-purpose LLMs don't have your team's engineering discipline built in. This project turns **21 engineering-grade AI collaboration principles** into a runnable runtime — after installing it, any AI tool behaves like an engineer who follows team norms: look before you call, align before you act, reuse before you reinvent, verify after every change, back up before destructive edits, and deliver the full version.

**One single source, auto-adapted to 8+ AI tools.** Different tools read different rule files; this project generates all of them with one command.

<br/>

[🚀 Quick Start](#-quick-start) · [🔧 Installation](#-installationwhich-md-does-each-ai-tool-need) · [✅ Verify](#-verify) · [📖 Commands](#-commands) · [📊 Benchmarks](#-benchmarks) · [🏗️ Architecture](#️-architecture)

</div>

---

## ⚡ Quick Start (30 seconds)

```bash
git clone https://github.com/quick123-666/eight-honors-shames-runtime.git
cd eight-honors-shames-runtime
npm install
npm run adapters      # generate adapter files for 8+ AI tools → adapters/
npm test              # 27 tests, including install-config verification
```

---

## 🔧 Installation(which md does each AI tool need?)

> **Different AI tools read different rule files**: some use `AGENTS.md`, some use `CLAUDE.md`, some use `.cursorrules`… This project generates each tool's adapter from a **single source** (`RULES.md` + `AGENTS.md`) — each adapter contains only the 21 compact principles and points back to the full version — **zero drift**.

### 1. Generate adapters

```bash
npm run adapters     # → adapters/ directory (idempotent, auto-syncs)
```

### 2. Per-tool configuration table

| Tool | File to configure | Where to place | Notes |
|---|---|---|---|
| **Pi** | `AGENTS.md` + `pi-extension/` | project root / `~/.pi/agent` | built-in, `pi install .` enables everything |
| **Claude Code** | `CLAUDE.md` | project root | auto-loaded per session |
| **Google Gemini CLI** | `GEMINI.md` | project root or `~/.gemini/GEMINI.md` (global) | reads either path |
| **GitHub Copilot** | `.github/copilot-instructions.md` | project root `.github/` | always active in repo |
| **Cursor** | `.cursorrules` (or `.cursor/rules/*.mdc`) | project root | always active |
| **Windsurf** | `.windsurfrules` | project root | always active |
| **Cline / Roo Code** | `custom-instructions.md` | Settings → Custom Instructions | workspace or global |
| **Codex / OpenCode / generic** | `AGENTS.md` | project root | follows [AGENTS.md](https://agents.md) standard |

```bash
# Example: install for Claude Code and Cursor
cp adapters/CLAUDE.md ../your-project/CLAUDE.md
cp adapters/.cursorrules ../your-project/.cursorrules
# Optional: full 21-principle version
cp RULES.md ../your-project/RULES.md
```

> 💡 Adapters contain only the 21 compact principles + a pointer to `RULES.md`. Drop `RULES.md` into your project to get the full version (shame/honor/logic/acceptance criteria).

### 3. Pi (full runtime, recommended)

```bash
pi install .          # extension + 5 skills
```

### 4. MCP hosts

```bash
cd mcp && npm install
npx eight-honors-shames-mcp   # stdio, read-only
```

Exposes: `rules_summary` / `rules_full` / `rules_status`.

---

## ✅ Verify

After installation, ask your AI tool:

> **"What are the 8-honors-8-shames principles?"**

- ✅ Working: it lists the 21 principles (look first, align, reuse, verify, full version, accompany to completion…)
- ❌ Not working: vague answer → check the file placement against the table above.

---

## 📖 Commands

| Command | Purpose |
|---|---|
| `/rules status` | current mode + default + rules version + tool stats |
| `/rules lite\|full\|ultra\|off` | set rule strength |
| `/rules default <mode>` | set default mode |
| `/rules audit` | audit current diff (changed files / delete risks) |
| `/rules accept` | acceptance gate (tests / rollback points) |
| `/rules benchmark` | run benchmark |
| `/rules help` | help |

Mode semantics:

```text
lite  core summary (look/align/reuse/verify)
full  summary + 3 gates (default)
ultra summary + 4 gates (incl. tests/build/rollback drill)
off   injection off, safety floor kept
```

---

## 📊 Benchmarks

### Injection cost (measured locally)

RULES.md (21 principles) is 13,196 bytes. Old design injected the full text every turn vs new design (once per session + summary per turn):

| Mode | Per-turn | 12-turn cumulative | Saved | 100-turn cumulative | Saved |
|---|---:|---:|---:|---:|---:|
| lite | ~223 B | ~8.6K tok | **81.9%** | — | **~97%** |
| full | ~273 B | ~8.7K tok | **81.6%** | — | **~97%** |
| ultra | ~314 B | ~8.9K tok | **81.4%** | — | **~97%** |

### Full vs minimal (real A/B)

| Metric | off | full |
|---|---:|---:|
| lines changed | 18 | 43 |
| integration tests | 1 | 3 |
| branches covered | active=true | true/false/absent |
| edge defense | none | parseActive |

> 8-honors-8-shames ≠ write less code. `full` writes more because principles 12/13 require completeness: edge cases, tests, input guards.

---

## 🏗️ Architecture

```text
Rules → single source RULES.md (21 principles)
   ↓ injection layers
session_start full text once + per-turn summary + gates
   ↓ tooling
/rules commands · MCP tools · audit · acceptance · benchmark
   ↓ adapter generation
npm run adapters → adapters/ (rule files for 8+ AI tools)
```

```
├── src/                 # core: injection / mode arbitration / audit / acceptance / benchmark / toolenv
├── scripts/             # CLI (check/adapters/benchmark/accept/smoke)
├── tests/               # 27 tests (incl. adapter install-config tests)
├── adapters/            # generated: rule files for 8+ tools (do not edit by hand)
├── mcp/                 # MCP server (stdio, read-only, 3 tools)
├── hooks/               # lifecycle hooks (Claude Code etc.)
├── commands/            # /rules command definitions (5)
├── skills/              # 5 agent skills
├── pi-extension/        # Pi extension bridge
├── benchmarks/          # scenarios & reports
└── config/  docs/  annotations/
```

---

## 🛠️ Development

```bash
npm test                 # 27 tests (unit + adapter install-config)
npm run check            # adapters + tests + rules sync + annotations
npm run adapters         # regenerate adapters/ (run after editing RULES/AGENTS)
npm run benchmark        # deterministic benchmark (no LLM)
npm run accept           # acceptance gate
```

### Credentials (real tool-environment benchmark)

```bash
export MINIMAX_API_KEY=... MINIMAX_BASE_URL=https://api.minimaxi.com/anthropic MINIMAX_MODEL=MiniMax-M3
SCENARIO=reuse-existing MODE=lite node scripts/run-toolenv-smoke.js
```

> Any OpenAI-compatible endpoint works: `EIGHT_RULES_LLM=openai` + `OPENAI_BASE_URL` / `OPENAI_API_KEY`.

---

## Hard Constraints

```text
1. No minimalism: the 21 principles are never trimmed
2. Single source = RULES.md: no adapter embeds the full text
3. Credentials only via env vars / platform stores, never plain .env
4. Deletions must be recoverable; snapshot before large changes
```

---

## Docs

| Doc | Content |
|---|---|
| [`docs/portability.md`](docs/portability.md) | 8-host adapter table (Pi/MCP/Claude Code/Codex/OpenCode/Gemini/OpenClaw/rules-based) |
| [`docs/benchmark-methodology.md`](docs/benchmark-methodology.md) | benchmark methodology |
| [`docs/injection.md`](docs/injection.md) | injection layer design |
| [`docs/lifecycle.md`](docs/lifecycle.md) | lifecycle hooks |
| [`docs/rule-sync.md`](docs/rule-sync.md) | single-source sync mechanism |
| [`docs/audit-2026-08-10.md`](docs/audit-2026-08-10.md) | interpretation audit (AI hallucination self-check) |
| [`docs/THINKING_FORMAT.md`](docs/THINKING_FORMAT.md) | **v1.0.1+** Thinking stage annotation format (makes discipline visible & auditable) |

---

## License

MIT © 2026 eight-honors-shames contributors
