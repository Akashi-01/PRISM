import "dotenv/config";

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) {
  throw new Error("JWT_SECRET must be set in .env (at least 32 characters)");
}

export const JWT_SECRET: string = secret;
export const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN ?? "7d";