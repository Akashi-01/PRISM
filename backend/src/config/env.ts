//  # validated env vars
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(5000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
    GEMINI_MODEL: z.string().default("gemini-3.5-flash"),
    GEMINI_FALLBACK_MODEL: z.string().optional(),
    LLM_PROVIDER: z.enum(["gemini", "groq"]).default("gemini"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment variables:");
    console.error(z.flattenError(parsed.error).fieldErrors);
    process.exit(1);
}

export const env = parsed.data;