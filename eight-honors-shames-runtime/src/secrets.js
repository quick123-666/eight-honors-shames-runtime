import { secretSummary, requiredKeysPresent } from "./env.js";

const cache = new Map();

export function getSecret(name) {
  if (!cache.has(name)) cache.set(name, process.env[name] || null);
  return cache.get(name);
}

export function withSecret(name, fn) {
  const value = getSecret(name);
  if (!value) throw new Error(`secret ${name} not available`);
  return fn(value);
}

export function reportSecrets() {
  return {
    available: requiredKeysPresent().present,
    summary: secretSummary()
  };
}
