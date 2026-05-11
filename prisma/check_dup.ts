import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const platforms = await prisma.platform.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, logo: true, sortOrder: true, createdAt: true },
  });
  console.log("=== المنصات ===");
  platforms.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name} | slug: ${p.slug} | logo: ${p.logo ? "✅" : "❌"} | sort: ${p.sortOrder} | id: ${p.id}`);
  });
  console.log(`\nالعدد الكلي: ${platforms.length}`);

  const programs = await prisma.program.findMany({ select: { id: true, name: true, slug: true, image: true } });
  console.log(`\nعدد البرامج: ${programs.length}`);
  const withImage = programs.filter(p => p.image);
  console.log(`البرامج مع صور: ${withImage.length}`);

  const activities = await prisma.activity.findMany({ select: { id: true, name: true, icon: true } });
  console.log(`\nعدد الأنشطة: ${activities.length}`);
  const withIcon = activities.filter(a => a.icon);
  console.log(`الأنشطة مع صور: ${withIcon.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
