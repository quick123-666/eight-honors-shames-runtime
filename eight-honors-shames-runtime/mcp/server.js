#!/usr/bin/env node
// 八荣八耻 MCP server：向支持 MCP 的宿主暴露规则查询工具
// 对标 ponytail-mcp。用 stdio 传输，仅只读，不碰外部系统。
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { summarize, fullInstructions, rulesVersion, rulesPath } from "../src/core.js";

const server = new McpServer({ name: "eight-honors-shames", version: "0.2.0" });

const modeArg = z
  .enum(["lite", "full", "ultra", "off"])
  .optional()
  .describe("八荣八耻强度: lite/full/ultra/off。省略时用默认 full。");

server.registerTool(
  "rules_summary",
  {
    title: "八荣八耻规则摘要",
    description: "返回指定模式的八荣八耻摘要（注入用，token 友好）。",
    inputSchema: { mode: modeArg },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  ({ mode }) => {
    const s = summarize(mode);
    return { content: [{ type: "text", text: s.summary }], structuredContent: { mode: s.mode, gates: s.gates } };
  }
);

server.registerTool(
  "rules_full",
  {
    title: "八荣八耻完整规则",
    description: "返回项目最新版完整规则全文（按需拉取，不自动注入）。",
    inputSchema: { mode: modeArg },
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  ({ mode }) => {
    const text = fullInstructions(mode);
    return { content: [{ type: "text", text }] };
  }
);

server.registerTool(
  "rules_status",
  {
    title: "八荣八耻状态",
    description: "返回规则版本、来源、准则数。",
    inputSchema: {},
    annotations: { readOnlyHint: true, openWorldHint: false }
  },
  () => {
    const v = rulesVersion();
    return {
      content: [{ type: "text", text: `准则数: ${v.principles}\n来源: ${v.source}\n文件: ${rulesPath}` }],
      structuredContent: { principles: v.principles, source: v.source, file: rulesPath }
    };
  }
);

await server.connect(new StdioServerTransport());
