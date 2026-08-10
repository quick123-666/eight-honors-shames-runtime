import express from "express";
import { USERS } from "./user/users.data.js";
import { filterActive } from "./user/filterActive.js";
import { normalizeUser } from "./user/normalize.js";

export const app = express();
app.use(express.json());

app.get("/api/users", (req, res) => {
  const raw = USERS.map(normalizeUser);
  const active = req.query.active;
  if (active === undefined) return res.json(raw);
  const want = active === "true";
  return res.json(filterActive(raw, want));
});

app.get("/api/login", (_req, res) => res.status(405).end());
