import { z } from "zod";
import { llm } from "../services/llm";

const TestSchema = z.object({
  intent: z.string(),
  requirements: z.array(z.string()),
});

async function main() {
  const result = await llm.generateJSON({
    systemPrompt:
      "You analyze prompts. Return JSON with keys: intent (string), requirements (array of strings).",
    userPrompt: "Write a python function that sorts a list of dictionaries by a given key.",
    schema: TestSchema,
  });

  console.log("DATA:", result.data);
  console.log("USAGE:", result.usage);
  console.log("MODEL:", result.model);

  const count = await llm.countTokens("Write a python function that sorts a list of dictionaries by a given key.");
  console.log("COUNT TOKENS:", count);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});