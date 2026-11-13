   import { prisma } from "../lib/prisma";

   (async () => {
     const name = process.argv[2];
     const exp = await prisma.experiment.findUniqueOrThrow({ where: { name } });
     const items = await prisma.experimentItem.findMany({
       where: { experimentId: exp.id, status: "success" },
       include: { session: { include: {
         evaluationSummaries: { where: { isCurrent: true } },
         evaluations: { where: { isCurrent: true } },
       } } },
     });
     for (const it of items) {
       const s = it.session!;
       const sum = s.evaluationSummaries[0];
       if (!sum || sum.qualityDelta >= -0.25) continue;
       const opt = s.evaluations.find((e) => e.variant === "optimized");
       console.log(`\n===== ${it.testPromptId} (${it.tag}) delta=${sum.qualityDelta} =====`);
       console.log("RAW      :", s.rawPrompt);
       console.log("OPTIMIZED:", s.optimizedPrompt);
       console.log("JUDGE    :", opt?.judgeRationale);
     }
   })().catch(console.error).finally(() => prisma.$disconnect());