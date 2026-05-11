import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const platforms = await prisma.platform.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      programs: { include: { activities: true } },
    },
  });

  for (const p of platforms) {
    console.log(`\n📌 ${p.name} (${p.slug}) - id: ${p.id}`);
    console.log(`   Programs: ${p.programs.length}`);
    for (const prog of p.programs) {
      console.log(`   📚 ${prog.name} (${prog.slug}) - Activities: ${prog.activities.length}`);
    }
  }

  const allData = await Promise.all([
    prisma.beneficiary.count(),
    prisma.enrollment.count(),
    prisma.participation.count(),
    prisma.project.count(),
    prisma.analyticsSnapshot.count(),
    prisma.contentPage.count(),
    prisma.newsPost.count(),
    prisma.siteSetting.count(),
  ]);

  console.log(`\n=== إحصائيات ===`);
  console.log(`Beneficiaries: ${allData[0]}`);
  console.log(`Enrollments: ${allData[1]}`);
  console.log(`Participations: ${allData[2]}`);
  console.log(`Projects: ${allData[3]}`);
  console.log(`Snapshots: ${allData[4]}`);
  console.log(`Content Pages: ${allData[5]}`);
  console.log(`News Posts: ${allData[6]}`);
  console.log(`Site Settings: ${allData[7]}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
