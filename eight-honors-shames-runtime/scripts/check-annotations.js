import { checkAnnotations } from "../src/annotations.js";

const samples = [
  "// eight-rules: reuse",
  "// eight-rules: security",
  "// eight-rules: invalid"
];
const errors = samples.flatMap((sample) => checkAnnotations(sample));
if (errors.length !== 1) {
  console.error(`annotation check failed: expected 1 invalid sample, got ${errors.length}`);
  process.exit(1);
}
console.log("annotation checks passed");
