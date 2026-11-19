import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/auth";

const SALT_ROUNDS = 12;
// compared against when the email does not exist, so both login failures take similar time
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", SALT_ROUNDS);

const publicUser = { id: true, email: true, name: true, createdAt: true } as const;

function signToken(userId: number): string {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): number | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    if (typeof payload === "string" || !payload.sub) return null;
    const id = Number(payload.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) return { error: "email_taken" as const };

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
    select: publicUser,
  });
  return { user, token: signToken(user.id) };
}

export async function loginUser(input: { email: string; password: string }) {
  const found = await prisma.user.findUnique({ where: { email: input.email } });
  const ok = await bcrypt.compare(input.password, found?.passwordHash ?? DUMMY_HASH);
  if (!found || !ok) return { error: "invalid_credentials" as const };

  const user = {
    id: found.id,
    email: found.email,
    name: found.name,
    createdAt: found.createdAt,
  };
  return { user, token: signToken(user.id) };
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({ where: { id }, select: publicUser });
}