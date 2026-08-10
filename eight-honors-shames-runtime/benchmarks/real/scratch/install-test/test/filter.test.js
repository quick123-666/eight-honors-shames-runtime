import test from "node:test";
import assert from "node:assert/strict";
import { filterActive } from "../src/user/filterActive.js";
import { USERS } from "../src/user/users.data.js";
import { normalizeUser } from "../src/user/normalize.js";
import { app } from "../src/app.js";

test("filterActive true", () => assert.equal(filterActive(USERS, true).length, 2));
test("normalizeUser empty nickname returns null", () => assert.equal(normalizeUser({ id: 1, nickname: "" }), null));

test("GET /api/users?active=true filters via filterActive", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const r = await fetch(`http://127.0.0.1:${port}/api/users?active=true`);
    const body = await r.json();
    assert.equal(Array.isArray(body), true);
    assert.equal(body.length, 2);
    assert.ok(body.every((u) => u && (u.id === 1 || u.id === 3)));
  } finally { server.close(); }
});
