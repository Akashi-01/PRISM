import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

// Hosted MySQL providers need TLS. Local dev leaves these unset.
// DATABASE_SSL_CA: provider's CA certificate (use \n for line breaks)
// DATABASE_SSL=true: use TLS with the system's trusted CAs
const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, "\n");
const ssl = ca
  ? { ca }
  : process.env.DATABASE_SSL === "true"
    ? true
    : undefined;

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
  ssl,
});

export const prisma = new PrismaClient({ adapter });