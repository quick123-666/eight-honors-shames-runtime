export const DECISIONS = Object.freeze(["reuse", "stdlib", "native", "dependency", "minimal", "security", "rollback", "deferred", "assumption", "boundary"]);

export function parseAnnotation(line) {
  const match = String(line).match(/eight-rules:\s*([a-z-]+)/i);
  if (!match) return null;
  const decision = match[1].toLowerCase();
  return { decision, valid: DECISIONS.includes(decision) };
}

export function checkAnnotations(text) {
  return String(text).split(/\r?\n/).flatMap((line, index) => {
    const result = parseAnnotation(line);
    return result && !result.valid ? [{ line: index + 1, decision: result.decision }] : [];
  });
}
