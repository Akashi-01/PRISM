import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

// Source = local DB (from .env). Target = hosted DB (from REMOTE_* env vars).
const local = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT ?? 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 2,
  }),
});

const remote = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: process.env.REMOTE_DATABASE_HOST,
    port: Number(process.env.REMOTE_DATABASE_PORT ?? 4000),
    user: process.env.REMOTE_DATABASE_USER,
    password: process.env.REMOTE_DATABASE_PASSWORD,
    database: process.env.REMOTE_DATABASE_NAME,
    connectionLimit: 2,
    ssl: true,
  }),
});

// null Json columns: omit them so the DB default (NULL) applies
const j = (v: unknown) => (v === null ? undefined : (v as any));
const drop = <T extends { id: number }>(row: T) => {
  const { id, ...rest } = row;
  return rest;
};

async function main() {
  if (!process.env.REMOTE_DATABASE_HOST) {
    throw new Error("Set REMOTE_DATABASE_* env vars first");
  }

  const experiments = await local.experiment.findMany({
    include: { items: true },
  });
  console.log(`Local experiments: ${experiments.length}`);

  for (const exp of experiments) {
    const exists = await remote.experiment.findUnique({
      where: { name: exp.name },
    });
    if (exists) {
      console.log(`SKIP "${exp.name}" (already on remote)`);
      continue;
    }

    // 1) copy every session this experiment points to, remembering old id -> new id
    const idMap = new Map<number, number>();
    const sessionIds = exp.items
      .map((i) => i.sessionId)
      .filter((id): id is number => id !== null);

    for (const oldId of sessionIds) {
      const s = await local.promptSession.findUnique({ where: { id: oldId } });
      if (!s) continue;

      const { id, userId, ...rest } = s;
      const created = await remote.promptSession.create({
        data: {
          ...rest,
          analysis: j(rest.analysis),
          meta: j(rest.meta),
          clarifications: j(rest.clarifications),
        },
      });
      idMap.set(oldId, created.id);
      const newId = created.id;

      const stages = await local.stageResult.findMany({ where: { sessionId: oldId } });
      if (stages.length) {
        await remote.stageResult.createMany({
          data: stages.map((r) => ({ ...drop(r), sessionId: newId, output: r.output as any })),
        });
      }
      const evals = await local.responseEvaluation.findMany({ where: { sessionId: oldId } });
      if (evals.length) {
        await remote.responseEvaluation.createMany({
          data: evals.map((r) => ({ ...drop(r), sessionId: newId })),
        });
      }
      const sums = await local.evaluationSummary.findMany({ where: { sessionId: oldId } });
      if (sums.length) {
        await remote.evaluationSummary.createMany({
          data: sums.map((r) => ({ ...drop(r), sessionId: newId })),
        });
      }
      const ratings = await local.humanRating.findMany({ where: { sessionId: oldId } });
      if (ratings.length) {
        await remote.humanRating.createMany({
          data: ratings.map((r) => ({ ...drop(r), sessionId: newId })),
        });
      }
    }

    // 2) the experiment and its items, with remapped session ids
    const { id: _expId, items, ...expRest } = exp;
    await remote.experiment.create({
      data: {
        ...expRest,
        items: {
          create: items.map((it) => {
            const { id, experimentId, sessionId, ...itRest } = it;
            return {
              ...itRest,
              sessionId: sessionId === null ? null : (idMap.get(sessionId) ?? null),
            };
          }),
        },
      },
    });
    console.log(`COPIED "${exp.name}": ${idMap.size} sessions, ${items.length} items`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await local.$disconnect();
    await remote.$disconnect();
  });