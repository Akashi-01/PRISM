import { evaluateSession } from "../evaluation/evaluateSession";

const id = Number(process.argv[2]);
if (!Number.isInteger(id) || id <= 0) {
  console.error("Usage: npm run test:evaluate -- <sessionId>");
  process.exit(1);
}

const result = await evaluateSession(id);
console.log(JSON.stringify(result, null, 2));
process.exit(0);