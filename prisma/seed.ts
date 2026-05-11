import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import seedData from "./rowwad_data.json";
import type {
  ActivityType,
  PartnerType,
  KnowledgeCategory,
  KnowledgeType,
  EnrollmentStatus,
  ParticipationStatus,
  TaskStatus,
  TaskPriority,
  EvaluationType,
  EvaluationStatus,
  JourneyStage,
  BeneficiaryStatus,
  MemberType,
} from "@prisma/client";

const prisma = new PrismaClient();

function slugify(text: string): string {
  const map: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'a', 'آ': 'a', 'ب': 'b', 'ت': 't',
    'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
    'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
    'ط': 't', 'ظ': 'z', 'ع': 'aa', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
    'ي': 'y', 'ة': 'h', 'ئ': 'e', 'ؤ': 'o', 'ى': 'a',
    ' ': '-',
  };
  let result = '';
  for (const ch of text) {
    if (map[ch]) result += map[ch];
    else if (/[a-zA-Z0-9-]/.test(ch)) result += ch;
  }
  return result.replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log("🚀 بدء إدخال البيانات التجريبية...\n");

  // ═══════════════════════════════════════════════════════════
  // 1. ADMIN USERS
  // ═══════════════════════════════════════════════════════════
  const adminExists = await prisma.adminUser.findUnique({ where: { email: "admin@rowad-network.org" } });
  if (!adminExists) {
    await prisma.adminUser.create({
      data: {
        email: "admin@rowad-network.org",
        passwordHash: await bcrypt.hash("Admin@2024!", 12),
        fullName: "المشرف العام",
        role: "SUPER_ADMIN",
      },
    });
  }
  console.log("✅ مستخدمو الإدارة");

  // ═══════════════════════════════════════════════════════════
  // 2. PARTNERS
  // ═══════════════════════════════════════════════════════════
  const partnersData = [
    { name: "منظمة اليتيم العالمية", slug: "international-orphan-organization", logo: "https://www.rowwad.net/uploads/thumbnails/gallery_thumbnails/3476e26c96e6f278ddef30da332347f9.jpg", type: "PARTNER" as PartnerType, sortOrder: 1 },
    { name: "مركز أبعاد السياسي", slug: "abaad-political-center", logo: "https://www.rowwad.net/uploads/thumbnails/gallery_thumbnails/238dc96f871d2fed0c514f5efec27fe1.jpg", type: "PARTNER" as PartnerType, sortOrder: 2 },
    { name: "مبرة الأعمال الخيرية", slug: "mabarrat-al-aamal-charity", logo: "https://www.rowwad.net/uploads/thumbnails/gallery_thumbnails/7f748914cf71679c562fbb588a01ce7b.jpg", type: "PARTNER" as PartnerType, sortOrder: 3 },
    { name: "مركز المجدد للبحوث والدراسات", slug: "almujaddid-research-center", logo: "https://www.rowwad.net/uploads/thumbnails/gallery_thumbnails/da5ced571ab00bac60e07fc57868c3c4.jpg", type: "PARTNER" as PartnerType, sortOrder: 4 },
    { name: "وزارة الأوقاف و الدعوة للوعظ و الارشاد في غزة", slug: "gaza-awqaf-dawah-ministry", logo: "https://www.rowwad.net/uploads/thumbnails/gallery_thumbnails/d0d6cfd82e52ca78b408af7e60d2a7a4.jpg", type: "PARTNER" as PartnerType, sortOrder: 5 },
    { name: "جمعية تكوين االإنسانية", slug: "takween-humanitarian-association", logo: "https://www.rowwad.net/uploads/thumbnails/gallery_thumbnails/134318cf8fc8b40ab18d85bdb6a5c722.jpg", type: "PARTNER" as PartnerType, sortOrder: 6 },
    { name: "أكاديمية باشاك شهير للعلوم العربية والإسلامية", slug: "basaksehir-academy", logo: "https://www.rowwad.net/uploads/thumbnails/gallery_thumbnails/603b7b7626eda7fb0af67790f036f110.jpg", type: "PARTNER" as PartnerType, sortOrder: 7 },
    { name: "مركز رؤيا للبحوث والدراسات", slug: "roya-research-center", logo: "https://www.rowwad.net/uploads/thumbnails/gallery_thumbnails/46c938fdf1ec1ed66d0591e3b0a871bc.jpg", type: "PARTNER" as PartnerType, sortOrder: 8 },
    { name: "شركة أمان للتسويق الرقمي والإعلام", slug: "aman-digital-marketing-media", logo: "https://www.rowwad.net/uploads/thumbnails/gallery_thumbnails/861d1dd9140e67460c2a9dd0ea74984f.jpg", type: "PARTNER" as PartnerType, sortOrder: 9 },
    { name: "مركز تكوين لبناء القادة", slug: "takween-leadership-center", logo: "https://www.rowwad.net/uploads/thumbnails/gallery_thumbnails/a1c73bab655357358d5514944a82204b.jpg", type: "PARTNER" as PartnerType, sortOrder: 10 },
    { name: "برنامج تمكين المرأة", slug: "women-empowerment-program", logo: "https://www.rowwad.net/uploads/thumbnails/gallery_thumbnails/72ede319ed703b54bcf2ec60609370fd.jpg", type: "PARTNER" as PartnerType, sortOrder: 11 },
  ];
  await prisma.partner.updateMany({ data: { isActive: false } });
  for (const p of partnersData) {
    await prisma.partner.upsert({
      where: { slug: p.slug },
      update: { ...p, isActive: true },
      create: { ...p, isActive: true },
    });
  }
  console.log("✅ الشركاء والداعمون (" + partnersData.length + ")");

  // ═══════════════════════════════════════════════════════════
  // 3. PLATFORMS → PROGRAMS → ACTIVITIES (from scraped data)
  // ═══════════════════════════════════════════════════════════

  // Map scraped Arabic platform names → existing English slugs in DB
  const platformNameToSlug: Record<string, string> = {
    "منصة ساند الإعلامية": "sand-media",
    "المنصة العالمية للدفاع عن حقوق الإنسان": "human-rights-platform",
    "منصة المرأة المسلمة": "muslim-woman-platform",
    "المنصة التربوية الشاملة": "comprehensive-education-platform",
    "منصة مفكر": "mufakkir-platform",
    "منصة تمكين العمل الإنساني": "humanitarian-work-platform",
    "منصة كلنا دعاة": "all-of-us-duat-platform",
    "منصة أفق السياسة": "political-horizon-platform",
    "منصة الإدارة والاقتصاد الإسلامي": "islamic-management-economy-platform",
  };

  const platformColorMap: Record<string, string> = {
    "منصة ساند الإعلامية": "#C62828",
    "المنصة العالمية للدفاع عن حقوق الإنسان": "#1565C0",
    "منصة المرأة المسلمة": "#7B1FA2",
    "المنصة التربوية الشاملة": "#2E7D32",
    "منصة مفكر": "#F57F17",
    "منصة تمكين العمل الإنساني": "#00695C",
    "منصة كلنا دعاة": "#4E342E",
    "منصة أفق السياسة": "#283593",
    "منصة الإدارة والاقتصاد الإسلامي": "#F9A825",
  };

  const platformIds: Record<string, string> = {};

  for (const platformData of seedData.platforms) {
    const slug = platformNameToSlug[platformData.name];
    if (!slug) {
      console.log(`⚠️  لا يوجد mapping للمنصة: ${platformData.name}`);
      continue;
    }

    let platform = await prisma.platform.findUnique({ where: { slug } });
    if (!platform) {
      console.log(`⚠️  المنصة غير موجودة في DB: ${slug} (${platformData.name})`);
      continue;
    }

    // Update platform with scraped image, description, and color
    await prisma.platform.update({
      where: { id: platform.id },
      data: {
        logo: platformData.image || platform.logo,
        description: platformData.description || platform.description,
        color: platformColorMap[platformData.name] || platform.color,
        sortOrder: seedData.platforms.indexOf(platformData) + 1,
      },
    });

    platformIds[slug] = platform.id;

    // ── Create Programs (Diplomas) via createMany ──
    const programsToCreate = platformData.diplomas.map((diploma, index) => ({
      name: diploma.name,
      slug: slugify(diploma.name),
      description: `دبلوم تابع لمنصة ${platformData.name}`,
      icon: diploma.image || null,
      image: diploma.image || null,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      maxBeneficiaries: 50 + Math.floor(Math.random() * 50),
      sortOrder: index + 1,
      platformId: platform.id,
    }));

    await prisma.program.createMany({
      data: programsToCreate,
      skipDuplicates: true,
    });

    // ── Create Courses (Activities) under each Diploma via createMany ──
    for (const diploma of platformData.diplomas) {
      const progSlug = slugify(diploma.name);
      const program = await prisma.program.findUnique({ where: { slug: progSlug } });
      if (!program) {
        console.log(`⚠️  Program not found after insert: ${diploma.name}`);
        continue;
      }

      const activitiesData = diploma.courses.map((course, index) => {
        const description = `المحاضر: ${course.instructor}${course.duration ? ` | المدة: ${course.duration}` : ""}${course.lessons ? ` | عدد الدروس: ${course.lessons}` : ""}`;
        return {
          name: course.title,
          slug: slugify(course.title + "-" + diploma.name),
          description,
          type: "COURSE" as ActivityType,
          icon: course.image || null,
          isOnline: true,
          sortOrder: index + 1,
          programId: program.id,
        };
      });

      await prisma.activity.createMany({
        data: activitiesData,
        skipDuplicates: true,
      });
    }

    // ── Create Non-Diploma Activities ──
    if (platformData.activities && platformData.activities.length > 0) {
      const actProgName = `الأنشطة والبرامج - ${platformData.name}`;
      const actProgSlug = slug + "-activities";

      await prisma.program.createMany({
        data: [{
          name: actProgName,
          slug: actProgSlug,
          description: `الأنشطة والبرامج المصاحبة لمنصة ${platformData.name}`,
          sortOrder: 99,
          platformId: platform.id,
        }],
        skipDuplicates: true,
      });

      const actProgram = await prisma.program.findUnique({ where: { slug: actProgSlug } });
      if (actProgram) {
        const nonDiplomaActivitiesData = platformData.activities.map((activity, index) => {
          const desc = (activity as any).instructor
            ? `${activity.name} | المحاضر: ${(activity as any).instructor}${(activity as any).duration ? ` | ${(activity as any).duration}` : ""}`
            : activity.name;
          const url = (activity as any).url || null;
          const fullDesc = url ? `${desc}\nالرابط: ${url}` : desc;
          return {
            name: activity.name,
            slug: slugify(activity.name + "-" + platformData.name),
            description: fullDesc,
            type: "COURSE" as ActivityType,
            isOnline: true,
            sortOrder: index + 1,
            programId: actProgram.id,
          };
        });

        await prisma.activity.createMany({
          data: nonDiplomaActivitiesData,
          skipDuplicates: true,
        });
      }
    }
  }
  console.log("✅ المنصات (" + seedData.platforms.length + ") والبرامج والأنشطة مع الصور");

  // ═══════════════════════════════════════════════════════════
  // 4. TEAM MEMBERS (TEAM type)
  // ═══════════════════════════════════════════════════════════
  const teamData = [
    { name: "أحمد عبد الله", slug: "ahmed-abdallah", role: "المدير التنفيذي", bio: "خبرة 15+ سنة في العمل الشبابي والتنموي", email: "ahmed@rowad-network.org", sortOrder: 1 },
    { name: "سارة محمد", slug: "sara-mohammad", role: "منسق البرامج", bio: "متخصصة في إدارة المشاريع التنموية", email: "sara@rowad-network.org", sortOrder: 2 },
    { name: "خالد يوسف", slug: "khaled-yousef", role: "المدير التقني", bio: "مطور Full-Stack بخبرة 8 سنوات", email: "khaled@rowad-network.org", sortOrder: 3 },
    { name: "نورة أحمد", slug: "noura-ahmed", role: "مسؤولة الإعلام الرقمي", bio: "متخصصة في استراتيجيات الإعلام الرقمي", email: "noura@rowad-network.org", sortOrder: 4 },
    { name: "عمر حسان", slug: "omar-hassan", role: "منسق المشاريع", bio: "خبرة في تنسيق المشاريع متعددة الأطراف", email: "omar@rowad-network.org", sortOrder: 5 },
    { name: "لمى سامي", slug: "lama-sami", role: "مصممة جرافيك أولى", bio: "خبرة في الهوية البصرية وتصميم UI/UX", email: "lama@rowad-network.org", sortOrder: 6 },
    { name: "زياد خالد", slug: "ziad-khaled", role: "باحث رئيسي", bio: "باحث في التنمية الرقمية وتحليل البيانات", email: "ziad@rowad-network.org", sortOrder: 7 },
    { name: "رنا إبراهيم", slug: "rana-ibrahim", role: "مسؤولة التواصل المجتمعي", bio: "متخصصة في العلاقات المجتمعية والتوعية", email: "rana@rowad-network.org", sortOrder: 8 },
    { name: "ماهر العباس", slug: "maher-abbas", role: "منسق التطوع", bio: "خبرة في إدارة برامج التطوع", sortOrder: 9 },
    { name: "هدى المالكي", slug: "huda-maliki", role: "مسؤولة الجودة والتقييم", bio: "متخصصة في ضمان الجودة وتقييم الأثر", sortOrder: 10 },
  ];
  const teamMemberIds: string[] = [];
  for (const member of teamData) {
    const existing = await prisma.beneficiary.findFirst({ where: { slug: member.slug } });
    if (!existing) {
      const parts = member.name.trim().split(/\s+/);
      const lastName = parts.length > 1 ? parts.pop()! : '';
      const firstName = parts.join(' ');
      const created = await prisma.beneficiary.create({
        data: {
          type: 'TEAM' as MemberType,
          code: `TM-${member.slug}`,
          firstName,
          lastName,
          role: member.role,
          slug: member.slug,
          bio: member.bio,
          email: member.email || null,
          sortOrder: member.sortOrder,
          status: 'ACTIVE' as BeneficiaryStatus,
          memberSince: new Date("2022-01-01"),
        },
      });
      teamMemberIds.push(created.id);
    }
  }
  console.log("✅ فريق العمل (" + teamData.length + ")");

  // ═══════════════════════════════════════════════════════════
  // 5. BENEFICIARIES (REAL ones with BENEFICIARY / BOTH types)
  // ═══════════════════════════════════════════════════════════
  const beneficiariesData = [
    { firstName: "مريم", lastName: "العبد الله", type: "BENEFICIARY" as MemberType, gender: "FEMALE" as const, country: "سوريا", city: "دمشق", educationLevel: "BACHELOR" as const },
    { firstName: "فاطمة", lastName: "الزهراء", type: "BENEFICIARY" as MemberType, gender: "FEMALE" as const, country: "العراق", city: "بغداد", educationLevel: "MASTER" as const },
    { firstName: "محمد", lastName: "الأمين", type: "BENEFICIARY" as MemberType, gender: "MALE" as const, country: "اليمن", city: "صنعاء", educationLevel: "BACHELOR" as const },
    { firstName: "أسماء", lastName: "خالد", type: "BOTH" as MemberType, gender: "FEMALE" as const, country: "فلسطين", city: "غزة", educationLevel: "MASTER" as const },
    { firstName: "عبد الرحمن", lastName: "الحسن", type: "BENEFICIARY" as MemberType, gender: "MALE" as const, country: "مصر", city: "القاهرة", educationLevel: "DIPLOMA" as const },
    { firstName: "نور", lastName: "حسان", type: "BENEFICIARY" as MemberType, gender: "FEMALE" as const, country: "لبنان", city: "بيروت", educationLevel: "BACHELOR" as const },
    { firstName: "إبراهيم", lastName: "الخطيب", type: "BOTH" as MemberType, gender: "MALE" as const, country: "فلسطين", city: "القدس", educationLevel: "DOCTORATE" as const },
    { firstName: "سلمى", lastName: "عبد الكريم", type: "BENEFICIARY" as MemberType, gender: "FEMALE" as const, country: "الأردن", city: "عمان", educationLevel: "BACHELOR" as const },
    { firstName: "أنس", lastName: "بشارة", type: "BENEFICIARY" as MemberType, gender: "MALE" as const, country: "سوريا", city: "حلب", educationLevel: "HIGH_SCHOOL" as const },
    { firstName: "هدى", lastName: "النعمان", type: "BOTH" as MemberType, gender: "FEMALE" as const, country: "السودان", city: "الخرطوم", educationLevel: "MASTER" as const },
    { firstName: "يوسف", lastName: "الغزالي", type: "BENEFICIARY" as MemberType, gender: "MALE" as const, country: "مصر", city: "الإسكندرية", educationLevel: "BACHELOR" as const },
    { firstName: "دعاء", lastName: "محمد", type: "BENEFICIARY" as MemberType, gender: "FEMALE" as const, country: "العراق", city: "النجف", educationLevel: "DIPLOMA" as const },
    { firstName: "باسل", lastName: "الصفدي", type: "BOTH" as MemberType, gender: "MALE" as const, country: "الأردن", city: "إربد", educationLevel: "BACHELOR" as const },
    { firstName: "شيماء", lastName: "أحمد", type: "BENEFICIARY" as MemberType, gender: "FEMALE" as const, country: "مصر", city: "القاهرة", educationLevel: "MASTER" as const },
    { firstName: "خليل", lastName: "الخليلي", type: "BENEFICIARY" as MemberType, gender: "MALE" as const, country: "فلسطين", city: "الخليل", educationLevel: "BACHELOR" as const },
  ];
  const beneficiaryIds: string[] = [];
  for (const b of beneficiariesData) {
    const fullName = b.firstName + " " + b.lastName;
    const slug = slugify(fullName);
    const existing = await prisma.beneficiary.findFirst({ where: { slug } });
    if (!existing) {
      const created = await prisma.beneficiary.create({
        data: {
          type: b.type,
          code: `BN-${slug}-${Math.random().toString(36).slice(2, 6)}`,
          firstName: b.firstName,
          lastName: b.lastName,
          slug,
          gender: b.gender,
          country: b.country,
          city: b.city,
          educationLevel: b.educationLevel,
          status: 'ACTIVE' as BeneficiaryStatus,
          memberSince: randomDate(new Date("2023-01-01"), new Date("2024-06-01")),
        },
      });
      beneficiaryIds.push(created.id);
    } else {
      beneficiaryIds.push(existing.id);
    }
  }
  console.log("✅ المستفيدون (" + beneficiariesData.length + ")");
  // ═══════════════════════════════════════════════════════════
  // 6. ENROLLMENTS
  // ═══════════════════════════════════════════════════════════
  const allPrograms = await prisma.program.findMany({
    where: { isActive: true, slug: { not: { contains: "activities" } } },
  });
  const statuses: EnrollmentStatus[] = ["ACTIVE", "COMPLETED", "PENDING", "DROPPED"];
  let enrollmentCount = 0;
  for (const bId of beneficiaryIds) {
    // Each beneficiary enrolls in 1-3 programs
    const numPrograms = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...allPrograms].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(numPrograms, shuffled.length); i++) {
      const program = shuffled[i];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const existing = await prisma.enrollment.findUnique({
        where: { beneficiaryId_programId: { beneficiaryId: bId, programId: program.id } },
      });
      if (!existing) {
        await prisma.enrollment.create({
          data: {
            beneficiaryId: bId,
            programId: program.id,
            status,
            enrolledAt: randomDate(new Date("2024-01-01"), new Date("2024-06-01")),
            completedAt: status === "COMPLETED" ? randomDate(new Date("2024-07-01"), new Date("2024-12-01")) : null,
          },
        });
        enrollmentCount++;
      }
    }
  }
  console.log("✅ التسجيلات (" + enrollmentCount + ")");

  // ═══════════════════════════════════════════════════════════
  // 7. PARTICIPATIONS
  // ═══════════════════════════════════════════════════════════
  const allActivities = await prisma.activity.findMany({ where: { isActive: true } });
  const participationStatuses: ParticipationStatus[] = ["REGISTERED", "ATTENDED", "COMPLETED", "ABSENT"];
  let participationCount = 0;
  for (const bId of beneficiaryIds) {
    const numActivities = 1 + Math.floor(Math.random() * 5);
    const shuffled = [...allActivities].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(numActivities, shuffled.length); i++) {
      const activity = shuffled[i];
      const status = participationStatuses[Math.floor(Math.random() * participationStatuses.length)];
      const existing = await prisma.participation.findUnique({
        where: { beneficiaryId_activityId: { beneficiaryId: bId, activityId: activity.id } },
      });
      if (!existing) {
        await prisma.participation.create({
          data: {
            beneficiaryId: bId,
            activityId: activity.id,
            status,
            attendedAt: status !== "REGISTERED" && status !== "CANCELLED"
              ? randomDate(new Date("2024-03-01"), new Date("2024-11-01"))
              : null,
            score: status === "COMPLETED" ? Math.floor(60 + Math.random() * 40) : null,
          },
        });
        participationCount++;
      }
    }
  }
  console.log("✅ المشاركات (" + participationCount + ")");

  // ═══════════════════════════════════════════════════════════
  // 8. BENEFICIARY JOURNEY STAGES
  // ═══════════════════════════════════════════════════════════
  const stages: JourneyStage[] = ["DISCOVERY", "APPLICATION", "ONBOARDING", "ACTIVE", "ADVANCED", "GRADUATED", "ALUMNI", "CHAMPION"];
  let journeyCount = 0;
  for (const bId of beneficiaryIds) {
    const numStages = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < Math.min(numStages, stages.length); i++) {
      const existing = await prisma.beneficiaryJourneyStage.findFirst({
        where: { beneficiaryId: bId, stage: stages[i] },
      });
      if (!existing) {
        await prisma.beneficiaryJourneyStage.create({
          data: {
            beneficiaryId: bId,
            stage: stages[i],
            startedAt: new Date(`2024-${String(1 + i * 2).padStart(2, "0")}-01`),
            completedAt: i < numStages - 1 ? new Date(`2024-${String(2 + i * 2).padStart(2, "0")}-15`) : null,
          },
        });
        journeyCount++;
      }
    }
  }
  console.log("✅ مراحل رحلة المستفيد (" + journeyCount + ")");

  // ═══════════════════════════════════════════════════════════
  // 9. PROJECTS
  // ═══════════════════════════════════════════════════════════
  const projectsData = [
    { title: "مشروع تمكين الإعلام الرقمي", slug: "digital-media-empowerment", description: "مشروع يهدف إلى تدريب 100 شاب على مهارات الإعلام الرقمي", category: "إعلام", platformSlug: "sand-media", status: "ACTIVE" as const },
    { title: "حملة التوعية بحقوق الإنسان", slug: "human-rights-awareness", description: "حملة توعوية شاملة حول حقوق الإنسان والقانون الدولي", category: "حقوق إنسان", platformSlug: "human-rights-platform", status: "ACTIVE" as const },
    { title: "مشروع تطوير المناهج التربوية", slug: "educational-curricula-dev", description: "تطوير مناهج تربوية مبتكرة للمعلمين", category: "تربية", platformSlug: "comprehensive-education-platform", status: "COMPLETED" as const },
    { title: "برنامج القيادات النسائية الشاملة", slug: "women-leadership-program", description: "برنامج متكامل لتمكين القيادات النسائية في المجتمع", category: "تمكين", platformSlug: "muslim-woman-platform", status: "ACTIVE" as const },
    { title: "مشروع الإغاثة الإنسانية الطارئة", slug: "emergency-humanitarian-relief", description: "مشروع إغاثي للمتضررين في مناطق النزاعات", category: "إغاثة", platformSlug: "humanitarian-work-platform", status: "ACTIVE" as const },
    { title: "مشروع بناء المفكر الناقد", slug: "critical-thinker-project", description: "برنامج تدريبي لتطوير مهارات التفكير الناقد والإبداعي", category: "فكر", platformSlug: "mufakkir-platform", status: "PLANNING" as const },
    { title: "مشروع فلسطين في الوعي العربي", slug: "palestine-awareness-project", description: "مشروع توعوي حول القضية الفلسطينية", category: "سياسة", platformSlug: "political-horizon-platform", status: "ACTIVE" as const },
  ];
  let projectCount = 0;
  for (const proj of projectsData) {
    const existing = await prisma.project.findUnique({ where: { slug: proj.slug } });
    if (!existing) {
      const platformId = platformIds[proj.platformSlug] || null;
      await prisma.project.create({
        data: {
          title: proj.title,
          slug: proj.slug,
          description: proj.description,
          category: proj.category,
          status: proj.status,
          platformId,
          startDate: new Date("2024-03-01"),
          endDate: proj.status === "COMPLETED" ? new Date("2024-12-31") : new Date("2025-06-30"),
          isFeatured: projectsData.indexOf(proj) < 3,
          sortOrder: projectsData.indexOf(proj) + 1,
        },
      });
      projectCount++;
    }
  }
  console.log("✅ المشاريع (" + projectCount + ")");

  // ═══════════════════════════════════════════════════════════
  // 10. KNOWLEDGE LIBRARY
  // ═══════════════════════════════════════════════════════════
  const knowledgeData = [
    { title: "تقرير الأثر السنوي — منصة ساند الإعلامية 2024", slug: "sand-media-impact-2024", description: "تقرير شامل يوثق أثر منصة ساند الإعلامية", category: "REPORT" as KnowledgeCategory, type: "DOCUMENT" as KnowledgeType, author: "زياد خالد", language: "ar", viewCount: 1250, downloadCount: 340, tags: "إعلام, تأثير, 2024, تقرير", isPublished: true },
    { title: "دليل الناشط الحقوقي", slug: "human-rights-activist-manual", description: "دليل إرشادي شامل للناشطين في مجال حقوق الإنسان", category: "MANUAL" as KnowledgeCategory, type: "DOCUMENT" as KnowledgeType, author: "رنا إبراهيم", language: "ar", viewCount: 890, downloadCount: 210, tags: "حقوق, ناشط, دليل", isPublished: true },
    { title: "حقيبة أدوات القيادة النسائية", slug: "women-leadership-toolkit", description: "مجموعة متكاملة من الأدوات لتطوير القيادة النسائية", category: "TOOLKIT" as KnowledgeCategory, type: "DOCUMENT" as KnowledgeType, author: "سارة محمد", language: "ar", viewCount: 670, downloadCount: 180, isPublished: true },
    { title: "بحث: واقع التعليم في العالم العربي 2024", slug: "arab-education-reality-research", description: "دراسة ميدانية شملت 3000 معلم في 12 دولة عربية", category: "RESEARCH" as KnowledgeCategory, type: "DOCUMENT" as KnowledgeType, author: "زياد خالد", language: "ar", viewCount: 2100, downloadCount: 520, tags: "بحث, تعليم, تربوي", isPublished: true },
    { title: "دروس مستفادة من دبلوم بناء المفكر", slug: "thinker-building-lessons", description: "توثيق لأهم الدروس المستفادة من الدبلوم الفكري", category: "LESSON" as KnowledgeCategory, type: "DOCUMENT" as KnowledgeType, author: "عمر حسان", language: "ar", viewCount: 450, downloadCount: 120, isPublished: true },
    { title: "دليل العمل الإنساني المهني", slug: "professional-humanitarian-manual", description: "دليل شامل للعاملين في المجال الإنساني", category: "MANUAL" as KnowledgeCategory, type: "DOCUMENT" as KnowledgeType, author: "ماهر العباس", language: "ar", viewCount: 340, downloadCount: 90, isPublished: true },
    { title: "فيديو: قصص نجاح المستفيدين 2024", slug: "success-stories-video-2024", description: "فيديو يوثق 10 قصص نجاح ملهمة", category: "REPORT" as KnowledgeCategory, type: "VIDEO" as KnowledgeType, author: "نورة أحمد", language: "ar", viewCount: 3400, downloadCount: 0, tags: "قصص نجاح, فيديو, 2024", isPublished: true },
    { title: "منهجية الدعوة في زمن الفتنة", slug: "dawa-methodology-tribulation", description: "دليل شامل للدعاة في التعامل مع الفتن المعاصرة", category: "MANUAL" as KnowledgeCategory, type: "DOCUMENT" as KnowledgeType, author: "خالد يوسف", language: "ar", viewCount: 230, downloadCount: 75, isPublished: true },
    { title: "ملخص تنفيذي: مؤشرات الأداء 2024", slug: "exec-summary-kpi-2024", description: "ملخص تنفيذي لأهم مؤشرات الأداء للعام 2024", category: "REPORT" as KnowledgeCategory, type: "SPREADSHEET" as KnowledgeType, author: "هدى المالكي", language: "ar", viewCount: 560, downloadCount: 145, isPublished: true },
    { title: "دراسة: أثر الإعلام الرقمي على الشباب", slug: "digital-media-impact-study", description: "دراسة تحليلية لأثر المحتوى الرقمي الهادف", category: "RESEARCH" as KnowledgeCategory, type: "DOCUMENT" as KnowledgeType, author: "نورة أحمد", language: "ar", viewCount: 780, downloadCount: 200, isPublished: true },
    { title: "القضية الفلسطينية: دراسة سياسية تاريخية", slug: "palestine-political-historical-study", description: "دراسة شاملة في القضية الفلسطينية", category: "RESEARCH" as KnowledgeCategory, type: "DOCUMENT" as KnowledgeType, author: "عمر حسان", language: "ar", viewCount: 1500, downloadCount: 430, tags: "فلسطين, سياسة, تاريخ", isPublished: true },
    { title: "نموذج تقييم المشاريع", slug: "project-evaluation-template", description: "نموذج موحد لتقييم المشاريع والمبادرات", category: "TOOLKIT" as KnowledgeCategory, type: "SPREADSHEET" as KnowledgeType, author: "هدى المالكي", language: "ar", viewCount: 310, downloadCount: 160, isPublished: true },
    { title: "قاعدة بيانات المنح والفرص", slug: "grants-opportunities-db", description: "قاعدة بيانات محدثة للمنح والفرص المتاحة للشباب العربي", category: "TOOLKIT" as KnowledgeCategory, type: "SPREADSHEET" as KnowledgeType, author: "رنا إبراهيم", language: "ar", viewCount: 1500, downloadCount: 430, tags: "منح, فرص, تمويل", isPublished: true },
    { title: "دليل الاقتصاد الإسلامي المعاصر", slug: "islamic-economy-guide", description: "دليل شامل في مفاهيم الاقتصاد الإسلامي", category: "MANUAL" as KnowledgeCategory, type: "DOCUMENT" as KnowledgeType, author: "زياد خالد", language: "ar", viewCount: 670, downloadCount: 190, isPublished: true },
    { title: "دليل: أفضل ممارسات التعليم عن بعد", slug: "remote-learning-best-practices", description: "دليل شامل لأفضل ممارسات التعليم عن بعد", category: "BEST_PRACTICE" as KnowledgeCategory, type: "DOCUMENT" as KnowledgeType, author: "سارة محمد", language: "ar", viewCount: 0, downloadCount: 0, isPublished: false, tags: "تعليم, عن بعد, دليل" },
  ];
  for (const k of knowledgeData) {
    const existing = await prisma.knowledgeItem.findUnique({ where: { slug: k.slug } });
    if (!existing) await prisma.knowledgeItem.create({ data: k });
  }
  console.log("✅ المكتبة المعرفية (" + knowledgeData.length + " عنصراً)");

  // ═══════════════════════════════════════════════════════════
  // 11. REPORT TEMPLATES
  // ═══════════════════════════════════════════════════════════
  const templateData = [
    {
      title: "تقرير الأداء الشهري للمنصة", slug: "monthly-platform-report",
      description: "قالب التقرير الشهري الموحد لأداء المنصات",
      category: "أداء المنصات",
      sections: JSON.stringify([
        { title: "ملخص تنفيذي", type: "textarea", required: true },
        { title: "عدد المستفيدين الجدد", type: "number", required: true },
        { title: "عدد المستفيدين النشطين", type: "number", required: true },
        { title: "الأنشطة المنفذة", type: "list", required: true },
        { title: "ساعات التطوع", type: "number", required: false },
        { title: "التحديات والعوائق", type: "textarea", required: false },
        { title: "التوصيات والخطوات القادمة", type: "textarea", required: false },
        { title: "تقييم الأداء الذاتي", type: "rating", required: true },
      ]),
    },
    {
      title: "تقرير تقييم الدبلوم الفصلي", slug: "quarterly-program-evaluation",
      description: "قالب تقييم الدبلومات الفصلي الشامل",
      category: "تقييم الدبلومات",
      sections: JSON.stringify([
        { title: "اسم الدبلوم", type: "text", required: true },
        { title: "الفترة الزمنية", type: "date_range", required: true },
        { title: "عدد المسجلين", type: "number", required: true },
        { title: "عدد المكملين", type: "number", required: true },
        { title: "نسبة الإكمال (%)", type: "percentage", required: true },
        { title: "نسبة التسرب (%)", type: "percentage", required: true },
        { title: "متوسط تقييم المتدربين", type: "rating", required: true },
        { title: "أبرز الإنجازات", type: "textarea", required: true },
        { title: "الدروس المستفادة", type: "textarea", required: true },
        { title: "خطة التحسين", type: "textarea", required: true },
      ]),
    },
    {
      title: "تقرير بيانات المستفيدين", slug: "beneficiary-data-report",
      description: "قالب توحيد بيانات المستفيدين الجدد",
      category: "بيانات المستفيدين",
      sections: JSON.stringify([
        { title: "الاسم الكامل", type: "text", required: true },
        { title: "البريد الإلكتروني", type: "email", required: true },
        { title: "رقم الجوال", type: "phone", required: true },
        { title: "الجنس", type: "select", required: true, options: ["ذكر", "أنثى"] },
        { title: "تاريخ الميلاد", type: "date", required: true },
        { title: "المستوى التعليمي", type: "select", required: true, options: ["ثانوية", "دبلوم", "بكالوريوس", "ماجستير", "دكتوراه"] },
        { title: "الدولة", type: "select", required: true },
        { title: "المدينة", type: "text", required: true },
        { title: "الدبلوم المراد التسجيل فيه", type: "select", required: true },
        { title: "كيف سمعت عنا؟", type: "select", required: false, options: ["وسائل التواصل", "صديق", "جامعة", "إعلان", "أخرى"] },
      ]),
    },
    {
      title: "تقرير تقييم النشاط", slug: "activity-evaluation-report",
      description: "قالب تقييم الأنشطة والفعاليات",
      category: "تقييم الأنشطة",
      sections: JSON.stringify([
        { title: "اسم النشاط", type: "text", required: true },
        { title: "تاريخ التنفيذ", type: "date", required: true },
        { title: "مدة النشاط (ساعات)", type: "number", required: true },
        { title: "عدد الحضور المتوقع", type: "number", required: true },
        { title: "عدد الحضور الفعلي", type: "number", required: true },
        { title: "تقييم المشاركين (1-5)", type: "rating", required: true },
        { title: "مدى تحقيق الأهداف", type: "rating", required: true },
        { title: "ملاحظات وتوصيات", type: "textarea", required: false },
      ]),
    },
    {
      title: "تقرير المبادرة — نموذج المنسق", slug: "initiative-coordinator-report",
      description: "نموذج التقرير الخاص بمنسقي المبادرات",
      category: "المبادرات",
      sections: JSON.stringify([
        { title: "اسم المبادرة", type: "text", required: true },
        { title: "المنصة التابعة", type: "select", required: true },
        { title: "تاريخ البدء", type: "date", required: true },
        { title: "تاريخ الانتهاء", type: "date", required: false },
        { title: "عدد أعضاء الفريق", type: "number", required: true },
        { title: "الميزانية المستخدمة", type: "number", required: false },
        { title: "الإنجازات الرئيسية", type: "textarea", required: true },
        { title: "التحديات", type: "textarea", required: true },
        { title: "توصيات للتطوير", type: "textarea", required: true },
      ]),
    },
  ];
  const templateById: Record<string, string> = {};
  for (const t of templateData) {
    let existing = await prisma.reportTemplate.findUnique({ where: { slug: t.slug } });
    if (!existing) existing = await prisma.reportTemplate.create({ data: t });
    templateById[t.slug] = existing.id;
  }
  console.log("✅ قوالب التقارير (" + templateData.length + ")");

  // ═══════════════════════════════════════════════════════════
  // 12. SUBMITTED REPORTS
  // ═══════════════════════════════════════════════════════════
  const allPlatformsList = await prisma.platform.findMany();
  const allReportTemplates = await prisma.reportTemplate.findMany();
  let submittedCount = 0;
  for (const platform of allPlatformsList) {
    for (const template of allReportTemplates) {
      const existing = await prisma.submittedReport.findFirst({
        where: { platformId: platform.id, templateId: template.id },
      });
      if (!existing && Math.random() > 0.5) {
        await prisma.submittedReport.create({
          data: {
            templateId: template.id,
            platformId: platform.id,
            data: JSON.stringify({ summary: "تقرير أداء " + platform.name, achieved: true }),
            status: Math.random() > 0.3 ? "SUBMITTED" : "DRAFT",
            submittedBy: "أحمد عبد الله",
            submittedAt: randomDate(new Date("2024-06-01"), new Date("2024-12-01")),
          },
        });
        submittedCount++;
      }
    }
  }
  console.log("✅ التقارير المرفوعة (" + submittedCount + ")");

  // ═══════════════════════════════════════════════════════════
  // 13. DATA STANDARDS
  // ═══════════════════════════════════════════════════════════
  const standardsData = [
    {
      name: "معيار بيانات المستفيد — الإصدار 2.0", slug: "beneficiary-standard-v2",
      description: "المعيار الموحد لإدخال بيانات المستفيدين الجدد",
      scope: "beneficiary",
      requiredFields: JSON.stringify(["firstName", "lastName", "email", "phone", "gender", "birthDate", "educationLevel", "nationality", "country", "city"]),
      validationRules: JSON.stringify({ email: { type: "email", required: true }, phone: { type: "international_phone", required: true }, birthDate: { type: "date", minAge: 15, maxAge: 35 }, educationLevel: { type: "enum", values: ["HIGH_SCHOOL", "DIPLOMA", "BACHELOR", "MASTER", "DOCTORATE", "OTHER"] } }),
    },
    {
      name: "معيار بيانات التسجيل في الدبلومات", slug: "enrollment-standard",
      description: "معيار تسجيل المستفيدين في الدبلومات",
      scope: "enrollment",
      requiredFields: JSON.stringify(["beneficiaryId", "programId", "status", "enrolledAt"]),
      validationRules: JSON.stringify({ status: { type: "enum", values: ["PENDING", "ACTIVE", "COMPLETED", "DROPPED", "REJECTED"] }, enrolledAt: { type: "date", required: true } }),
    },
    {
      name: "معيار بيانات المشاركة في الأنشطة", slug: "participation-standard",
      description: "معيار تسجيل وتقييم المشاركة في الأنشطة",
      scope: "activity",
      requiredFields: JSON.stringify(["beneficiaryId", "activityId", "status"]),
      validationRules: JSON.stringify({ status: { type: "enum", values: ["REGISTERED", "ATTENDED", "COMPLETED", "ABSENT", "CANCELLED"] }, score: { type: "number", min: 0, max: 100 } }),
    },
    {
      name: "معيار جودة التقارير", slug: "report-quality-standard",
      description: "معيار ضمان جودة التقارير المرفوعة",
      scope: "report",
      requiredFields: JSON.stringify(["templateId", "data", "submittedBy"]),
    },
  ];
  for (const s of standardsData) {
    const existing = await prisma.dataStandard.findUnique({ where: { slug: s.slug } });
    if (!existing) await prisma.dataStandard.create({ data: s });
  }
  console.log("✅ معايير البيانات (" + standardsData.length + ")");

  // ═══════════════════════════════════════════════════════════
  // 14. COORDINATION TASKS
  // ═══════════════════════════════════════════════════════════
  const taskData = [
    { title: "تجهيز مواد الدبلوم التربوي", description: "تجهيز المحاضرات والمواد التعليمية للفصل القادم", priority: "HIGH" as TaskPriority, platformSlug: "comprehensive-education-platform" },
    { title: "متابعة تسجيلات دبلوم الإعلام", description: "متابعة ومراجعة طلبات التسجيل الجديدة", priority: "MEDIUM" as TaskPriority, platformSlug: "sand-media" },
    { title: "تحديث قاعدة بيانات المستفيدين", description: "تنظيف وتحديث بيانات المستفيدين النشطين", priority: "HIGH" as TaskPriority },
    { title: "إعداد تقرير الأداء الربعي", description: "جمع البيانات وإعداد التقرير الربعي للمنصات", priority: "URGENT" as TaskPriority },
    { title: "تنظيم ندوة حقوقية دولية", description: "التنسيق لعقد ندوة دولية حول حقوق الإنسان", priority: "MEDIUM" as TaskPriority, platformSlug: "human-rights-platform" },
    { title: "تطوير محتوى الدبلوم الفكري", description: "إضافة محاضرات جديدة لدبلوم بناء المفكر", priority: "LOW" as TaskPriority, platformSlug: "mufakkir-platform" },
    { title: "متابعة خريجات القيادات النسائية", description: "التواصل مع خريجات الدفعة الأولى لمتابعة أثرهن", priority: "MEDIUM" as TaskPriority, platformSlug: "muslim-woman-platform" },
    { title: "تحديث المنصة التقنية", description: "تطوير وتحسين أداء المنصة الإلكترونية", priority: "HIGH" as TaskPriority },
    { title: "إعداد ميزانية 2025", description: "إعداد خطة الميزانية السنوية للعام القادم", priority: "URGENT" as TaskPriority },
    { title: "تقييم دبلوم الدعوة", description: "إجراء تقييم شامل لأداء دبلوم الدعوة في زمن الفتنة", priority: "MEDIUM" as TaskPriority, platformSlug: "all-of-us-duat-platform" },
  ];
  let taskCount = 0;
  for (const task of taskData) {
    const existing = await prisma.coordinationTask.findFirst({ where: { title: task.title } });
    if (!existing) {
      const platformId = task.platformSlug ? platformIds[task.platformSlug] : null;
      await prisma.coordinationTask.create({
        data: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.priority === "URGENT" ? "IN_PROGRESS" as TaskStatus : "PENDING" as TaskStatus,
          assignee: "أحمد عبد الله",
          assigneeRole: "المدير التنفيذي",
          dueDate: task.priority === "URGENT" ? new Date("2025-01-15") : new Date("2025-03-01"),
          platformId,
        },
      });
      taskCount++;
    }
  }
  console.log("✅ مهام التنسيق (" + taskCount + ")");

  // ═══════════════════════════════════════════════════════════
  // 15. EVALUATIONS
  // ═══════════════════════════════════════════════════════════
  const evaluationTypes: EvaluationType[] = ["PROGRAM", "ACTIVITY", "PLATFORM", "PROJECT"];
  const evalStatuses: EvaluationStatus[] = ["DRAFT", "FINAL", "APPROVED"];
  let evalCount = 0;
  for (const platform of allPlatformsList) {
    if (Math.random() > 0.6) continue;
    const evalType = evaluationTypes[Math.floor(Math.random() * evaluationTypes.length)];
    const existing = await prisma.evaluation.findFirst({ where: { platformId: platform.id, type: evalType } });
    if (!existing) {
      const evalStatus = evalStatuses[Math.floor(Math.random() * evalStatuses.length)];
      await prisma.evaluation.create({
        data: {
          title: `تقييم ${platform.name} - ${evalType === "PROGRAM" ? "البرامج" : evalType === "ACTIVITY" ? "الأنشطة" : evalType === "PLATFORM" ? "المنصة" : "المشاريع"}`,
          evaluator: "هدى المالكي",
          evaluatorRole: "مسؤولة الجودة والتقييم",
          type: evalType,
          score: 70 + Math.floor(Math.random() * 30),
          maxScore: 100,
          feedback: "أداء جيد مع بعض الملاحظات التي تم تسجيلها للتطوير",
          recommendations: "العمل على تحسين نسبة الإكمال وزيادة التفاعل",
          status: evalStatus,
          platformId: platform.id,
          evaluatedAt: randomDate(new Date("2024-06-01"), new Date("2024-11-01")),
        },
      });
      evalCount++;
    }
  }
  console.log("✅ التقييمات (" + evalCount + ")");

  // ═══════════════════════════════════════════════════════════
  // 16. PLATFORM INDICATORS
  // ═══════════════════════════════════════════════════════════
  const platformIndicatorsData: Record<string, { key: string; name: string; value: number; target: number; unit: string }[]> = {
    "sand-media": [
      { key: "active_beneficiaries", name: "المستفيدون النشطون", value: 180, target: 250, unit: "مستفيد" },
      { key: "completion_rate", name: "نسبة إكمال الدبلومات", value: 78, target: 85, unit: "%" },
      { key: "satisfaction_score", name: "معدل الرضا العام", value: 4.3, target: 4.8, unit: "/5" },
    ],
    "human-rights-platform": [
      { key: "active_beneficiaries", name: "المستفيدون النشطون", value: 200, target: 300, unit: "مستفيد" },
      { key: "completion_rate", name: "نسبة إكمال الدبلومات", value: 82, target: 88, unit: "%" },
      { key: "satisfaction_score", name: "معدل الرضا العام", value: 4.5, target: 4.8, unit: "/5" },
    ],
    "muslim-woman-platform": [
      { key: "active_beneficiaries", name: "المستفيدات النشطات", value: 165, target: 200, unit: "مستفيدة" },
      { key: "completion_rate", name: "نسبة الإكمال", value: 85, target: 90, unit: "%" },
    ],
    "comprehensive-education-platform": [
      { key: "active_beneficiaries", name: "المستفيدون النشطون", value: 250, target: 350, unit: "مستفيد" },
      { key: "completion_rate", name: "نسبة الإكمال", value: 80, target: 85, unit: "%" },
      { key: "teachers_trained", name: "المعلمون المدربون", value: 180, target: 250, unit: "معلم" },
    ],
    "mufakkir-platform": [
      { key: "active_beneficiaries", name: "المستفيدون النشطون", value: 95, target: 130, unit: "مستفيد" },
      { key: "completion_rate", name: "نسبة الإكمال", value: 88, target: 92, unit: "%" },
    ],
    "humanitarian-work-platform": [
      { key: "active_beneficiaries", name: "المستفيدون النشطون", value: 130, target: 180, unit: "مستفيد" },
      { key: "completion_rate", name: "نسبة الإكمال", value: 83, target: 87, unit: "%" },
    ],
    "all-of-us-duat-platform": [
      { key: "active_beneficiaries", name: "المستفيدون النشطون", value: 75, target: 100, unit: "مستفيد" },
      { key: "completion_rate", name: "نسبة الإكمال", value: 72, target: 80, unit: "%" },
    ],
    "political-horizon-platform": [
      { key: "active_beneficiaries", name: "المستفيدون النشطون", value: 160, target: 220, unit: "مستفيد" },
      { key: "completion_rate", name: "نسبة الإكمال", value: 86, target: 90, unit: "%" },
    ],
    "islamic-management-economy-platform": [
      { key: "active_beneficiaries", name: "المستفيدون النشطون", value: 55, target: 80, unit: "مستفيد" },
      { key: "completion_rate", name: "نسبة الإكمال", value: 80, target: 85, unit: "%" },
    ],
  };
  for (const [pSlug, indicators] of Object.entries(platformIndicatorsData)) {
    const platformId = platformIds[pSlug];
    if (!platformId) continue;
    for (const i of indicators) {
      const existing = await prisma.platformIndicator.findFirst({ where: { platformId, indicatorKey: i.key } });
      if (!existing) {
        await prisma.platformIndicator.create({
          data: { platformId, indicatorKey: i.key, indicatorName: i.name, value: i.value, target: i.target, unit: i.unit },
        });
      }
    }
  }
  console.log("✅ مؤشرات المنصات");

  // ═══════════════════════════════════════════════════════════
  // 17. PROGRAM INDICATORS
  // ═══════════════════════════════════════════════════════════
  const allDiplomaPrograms = await prisma.program.findMany({
    where: { isActive: true, slug: { not: { contains: "activities" } } },
  });
  let progIndCount = 0;
  for (const prog of allDiplomaPrograms) {
    const indicators = [
      { key: "enrollment_total", name: "إجمالي المسجلين", value: 30 + Math.floor(Math.random() * 70), target: 60, unit: "مسجل" },
      { key: "completion_rate", name: "نسبة الإكمال", value: 70 + Math.floor(Math.random() * 25), target: 85, unit: "%" },
    ];
    for (const i of indicators) {
      const existing = await prisma.programIndicator.findFirst({ where: { programId: prog.id, indicatorKey: i.key } });
      if (!existing) {
        await prisma.programIndicator.create({
          data: { programId: prog.id, indicatorKey: i.key, indicatorName: i.name, value: i.value, target: i.target, unit: i.unit },
        });
        progIndCount++;
      }
    }
  }
  console.log("✅ مؤشرات الدبلومات (" + progIndCount + ")");

  // ═══════════════════════════════════════════════════════════
  // 18. ANALYTICS SNAPSHOTS
  // ═══════════════════════════════════════════════════════════
  const snapshotsData = [
    { title: "تقرير الأداء الربعي — Q1 2024", period: "quarterly", periodStart: new Date("2024-01-01"), periodEnd: new Date("2024-03-31"), data: JSON.stringify({ totalBeneficiaries: 450, activePrograms: 18, completionRate: 82, satisfactionRate: 4.4, totalActivities: 56 }), summary: "أداء جيد في الربع الأول مع تحقيق معظم المستهدفات" },
    { title: "تقرير الأداء الربعي — Q2 2024", period: "quarterly", periodStart: new Date("2024-04-01"), periodEnd: new Date("2024-06-30"), data: JSON.stringify({ totalBeneficiaries: 520, activePrograms: 20, completionRate: 84, satisfactionRate: 4.5, totalActivities: 72 }), summary: "تحسن ملحوظ في مؤشرات الأداء مقارنة بالربع الأول" },
    { title: "تقرير الأداء الربعي — Q3 2024", period: "quarterly", periodStart: new Date("2024-07-01"), periodEnd: new Date("2024-09-30"), data: JSON.stringify({ totalBeneficiaries: 610, activePrograms: 22, completionRate: 85, satisfactionRate: 4.6, totalActivities: 85 }), summary: "استمرار في النمو وتحقيق الأهداف" },
    { title: "تقرير الأداء السنوي — 2024", period: "yearly", periodStart: new Date("2024-01-01"), periodEnd: new Date("2024-12-31"), data: JSON.stringify({ totalBeneficiaries: 780, activePrograms: 25, completionRate: 83, satisfactionRate: 4.5, totalActivities: 320, totalProjects: 7, partnerCount: 7 }), summary: "عام حافل بالإنجازات مع تحقيق نمو 35% في عدد المستفيدين" },
  ];
  for (const s of snapshotsData) {
    const existing = await prisma.analyticsSnapshot.findFirst({ where: { title: s.title } });
    if (!existing) {
      await prisma.analyticsSnapshot.create({ data: s });
    }
  }
  console.log("✅ لقطات التحليلات (" + snapshotsData.length + ")");

  // ═══════════════════════════════════════════════════════════
  // 19. CONTENT PAGES
  // ═══════════════════════════════════════════════════════════
  const contentPagesData = [
    { title: "من نحن", slug: "about-us", content: "<h2>شبكة الروّاد الإلكترونية</h2><p>شبكة روّاد إلكترونية غير ربحية، تسعى لتمكين الشباب العربي من خلال برامج تدريبية متخصصة في مجالات الإعلام وحقوق الإنسان والتربية والفكر والعمل الإنساني.</p><p>تضم الشبكة 9 منصات متخصصة تقدم أكثر من 25 دبلوماً وبرنامجاً تدريبياً مجاناً.</p>", metaDesc: "تعرف على شبكة الروّاد الإلكترونية ورسالتها", isPublished: true },
    { title: "الرؤية والرسالة", slug: "vision-mission", content: "<h2>رؤيتنا</h2><p>الريادة في تمكين الشباب العربي علمياً ومهارياً وقيمياً.</p><h2>رسالتنا</h2><p>تقديم برامج تدريبية نوعية مجانية تُحدث نقلة نوعية في مسيرة الشباب العربي.</p>", metaDesc: "رؤية ورسالة شبكة الروّاد", isPublished: true },
    { title: "سياسة الخصوصية", slug: "privacy-policy", content: "<h2>سياسة الخصوصية</h2><p>نحن في شبكة الروّاد الإلكترونية نلتزم بحماية خصوصية مستخدمينا.</p>", isPublished: true },
    { title: "شروط الاستخدام", slug: "terms-of-use", content: "<h2>شروط الاستخدام</h2><p>باستخدامك لهذه المنصة فإنك توافق على الشروط والأحكام التالية...</p>", isPublished: true },
    { title: "الأسئلة الشائعة", slug: "faq", content: "<h2>الأسئلة الشائعة</h2><p>إجابات لأكثر الأسئلة شيوعاً حول منصات وبرامج الشبكة.</p>", metaDesc: "أجوبة على الأسئلة الشائعة", isPublished: false },
  ];
  for (const page of contentPagesData) {
    const existing = await prisma.contentPage.findUnique({ where: { slug: page.slug } });
    if (!existing) await prisma.contentPage.create({ data: page });
  }
  console.log("✅ صفحات المحتوى (" + contentPagesData.length + ")");

  // ═══════════════════════════════════════════════════════════
  // 20. NEWS POSTS
  // ═══════════════════════════════════════════════════════════
  const newsData = [
    { title: "افتتاح التسجيل في الدبلوم التربوي الشامل", slug: "edu-diploma-registration-open", excerpt: "أعلنت شبكة الروّاد عن فتح باب التسجيل في الدبلوم التربوي الشامل النسخة الثانية", content: "تعلن شبكة الروّاد الإلكترونية عن فتح باب التسجيل في الدبلوم التربوي الشامل النسخة الثانية والتي تشمل...", category: "أخبار", isPublished: true },
    { title: "ختام دبلوم حقوق الإنسان - الدفعة الأولى", slug: "human-rights-diploma-graduation", excerpt: "تخريج 45 ناشطاً حقوقياً من الدفعة الأولى لدبلوم حقوق الإنسان", content: "احتفلت شبكة الروّاد بتخريج الدفعة الأولى من دبلوم حقوق الإنسان...", category: "إنجازات", isPublished: true },
    { title: "إطلاق منصة أفق السياسة", slug: "political-horizon-launch", excerpt: "شبكة الروّاد تطلق منصة أفق السياسة المتخصصة في الشؤون السياسية", content: "في إطار توسع شبكة الروّاد، تم إطلاق منصة أفق السياسة...", category: "أخبار", isPublished: true },
    { title: "شراكة استراتيجية جديدة", slug: "new-strategic-partnership", excerpt: "شبكة الروّاد توقع اتفاقية شراكة مع مؤسسة تنمية الشباب", content: "وقعت شبكة الروّاد اتفاقية شراكة استراتيجية مع مؤسسة تنمية الشباب...", category: "شراكات", isPublished: true },
    { title: "تخريج الدفعة الثالثة من دبلوم العمل الإنساني", slug: "humanitarian-diploma-batch3-graduation", excerpt: "تخريج 55 متدرباً من دبلوم العمل الخيري والإنساني", content: "احتفلت منصة تمكين العمل الإنساني بتخريج الدفعة الثالثة من الدبلوم...", category: "إنجازات", isPublished: true },
    { title: "ندوة دولية حول حقوق الإنسان", slug: "international-human-rights-seminar", excerpt: "شبكة الروّاد تنظم ندوة دولية بمشاركة 12 دولة", content: "نظمت المنصة العالمية للدفاع عن حقوق الإنسان ندوة دولية...", category: "فعاليات", isPublished: false },
  ];
  for (const news of newsData) {
    const existing = await prisma.newsPost.findUnique({ where: { slug: news.slug } });
    if (!existing) await prisma.newsPost.create({ data: news });
  }
  console.log("✅ الأخبار (" + newsData.length + ")");

  // ═══════════════════════════════════════════════════════════
  // 21. SITE SETTINGS
  // ═══════════════════════════════════════════════════════════
  const siteSettingsData = [
    { key: "site_name", value: "شبكة الروّاد الإلكترونية" },
    { key: "site_description", value: "منصة تعليمية وتدريبية متخصصة تضم 9 منصات في مجالات الإعلام وحقوق الإنسان والتربية والفكر والعمل الإنساني" },
    { key: "site_email", value: "info@rowad-network.org" },
    { key: "site_phone", value: "+96551686989" },
    { key: "social_facebook", value: "https://facebook.com/rowadnetwork" },
    { key: "social_twitter", value: "https://twitter.com/rowadnetwork" },
    { key: "social_whatsapp", value: "https://api.whatsapp.com/send?phone=+96551686989" },
    { key: "social_telegram", value: "https://t.me/rowadnetwork" },
    { key: "footer_about", value: "شبكة روّاد إلكترونية غير ربحية تضم 9 منصات متخصصة تقدم برامج تدريبية مجانية" },
    { key: "footer_copyright", value: "جميع الحقوق محفوظة © 2024 شبكة الروّاد الإلكترونية" },
    { key: "maintenance_mode", value: "false" },
    { key: "registration_open", value: "true" },
    { key: "site_logo", value: "/logo-dark.png" },
    { key: "site_favicon", value: "/favicon.ico" },
  ];
  for (const setting of siteSettingsData) {
    const existing = await prisma.siteSetting.findUnique({ where: { key: setting.key } });
    if (!existing) await prisma.siteSetting.create({ data: setting });
  }
  console.log("✅ إعدادات الموقع (" + siteSettingsData.length + ")");

  // ═══════════════════════════════════════════════════════════
  // 22. WEBHOOKS
  // ═══════════════════════════════════════════════════════════
  const webhooksData = [
    { name: "Slack — إشعارات المستفيدين الجدد", url: "https://hooks.slack.com/services/example/webhook-1", events: JSON.stringify(["beneficiary.created", "enrollment.created"]), isActive: false },
    { name: "Google Analytics Export", url: "https://analytics.example.com/webhook", events: JSON.stringify(["analytics.updated", "report.submitted"]), isActive: false },
    { name: "Mailchimp — تزامن جهات الاتصال", url: "https://us1.api.mailchimp.com/3.0/webhooks", events: JSON.stringify(["beneficiary.created", "beneficiary.updated"]), isActive: false },
  ];
  for (const wh of webhooksData) {
    const existing = await prisma.webhook.findFirst({ where: { name: wh.name } });
    if (!existing) await prisma.webhook.create({ data: wh });
  }
  console.log("✅ نقاط التكامل (" + webhooksData.length + ")");

  // ═══════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════
  const summaries = {
    platforms: await prisma.platform.count(),
    programs: await prisma.program.count(),
    activities: await prisma.activity.count(),
    team: await prisma.beneficiary.count({ where: { type: "TEAM" } }),
    beneficiaries: await prisma.beneficiary.count({ where: { type: { in: ["BENEFICIARY", "BOTH"] } } }),
    enrollments: await prisma.enrollment.count(),
    participations: await prisma.participation.count(),
    journeyStages: await prisma.beneficiaryJourneyStage.count(),
    projects: await prisma.project.count(),
    knowledgeItems: await prisma.knowledgeItem.count(),
    reportTemplates: await prisma.reportTemplate.count(),
    submittedReports: await prisma.submittedReport.count(),
    coordinationTasks: await prisma.coordinationTask.count(),
    evaluations: await prisma.evaluation.count(),
    analyticsSnapshots: await prisma.analyticsSnapshot.count(),
    contentPages: await prisma.contentPage.count(),
    newsPosts: await prisma.newsPost.count(),
    siteSettings: await prisma.siteSetting.count(),
    webhooks: await prisma.webhook.count(),
    partners: await prisma.partner.count(),
    platformIndicators: await prisma.platformIndicator.count(),
    programIndicators: await prisma.programIndicator.count(),
  };

  console.log("\n" + "=".repeat(60));
  console.log("🎉 تم إدخال جميع البيانات بنجاح!");
  console.log("=".repeat(60));
  for (const [key, value] of Object.entries(summaries)) {
    console.log(`   ${key}: ${value}`);
  }
  console.log("=".repeat(60));
  console.log("\n🔑 تسجيل الدخول: admin@rowad-network.org / Admin@2024!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
