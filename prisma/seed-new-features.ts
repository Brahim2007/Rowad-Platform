/**
 * بذرة بيانات تجريبية للأنظمة الجديدة
 * منصات ← مدراء منصات ← أعضاء بحسابات ← أنشطة ← إشعارات ← وثائق
 * npm run seed:new
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function randomLocalPassword() {
  return `Local-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}!`
}

async function main() {
  console.log("🌱 بدء بذرة الأنظمة الجديدة...\n");

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  // ════════════ 1. إعدادات لوحة الأثر ════════════
  const settingsExists = await (prisma as any).impactSettings.findUnique({ where: { id: 1 } });
  if (!settingsExists) {
    await (prisma as any).impactSettings.create({
      data: {
        id: 1,
        qualityBonus: JSON.stringify({ WEAK: -3, ACCEPTABLE: 0, GOOD: 3, EXCELLENT: 6, EXCEPTIONAL: 10 }),
        levels: JSON.stringify([
          { name: "عضو جديد", from: 0, to: 99 },
          { name: "عضو نشط", from: 100, to: 299 },
          { name: "عضو مؤثر", from: 300, to: 599 },
          { name: "عضو متميز", from: 600, to: 999 },
          { name: "رائد ذهبي", from: 1000, to: 1999 },
          { name: "سفير الرواد", from: 2000, to: 9999999 },
        ]),
        rewardTiers: JSON.stringify([
          { name: "لا مكافأة", from: 0, to: 99 },
          { name: "رمزية", from: 100, to: 149 },
          { name: "أساسية", from: 150, to: 249 },
          { name: "متوسطة", from: 250, to: 399 },
          { name: "كاملة + درع", from: 400, to: 9999999 },
        ]),
        umrah: JSON.stringify({ minYearly: 3000, minMonths: 9, minInitiatives: 1, requireExcellent: true, noViolations: true }),
      },
    });
    console.log("✅ إعدادات لوحة الأثر");
  } else {
    console.log("⏭️  إعدادات لوحة الأثر — موجودة");
  }

  // ════════════ 2. جلب المنصات ════════════
  const platforms = await prisma.platform.findMany({ where: { isActive: true }, take: 3 });
  if (platforms.length < 2) {
    console.log("⚠️  تحتاج منصتين على الأقل — تأكد من تشغيل seed الأساسي أولاً");
    return;
  }
  const [platA, platB] = platforms;

  // ════════════ 3. إنشاء مدراء منصات ════════════
  const managerEmail = process.env.SEED_MANAGER_EMAIL || "manager@example.test";
  const managerPassword = process.env.SEED_MANAGER_PASSWORD || randomLocalPassword();
  const existingManager = await prisma.adminUser.findUnique({ where: { email: managerEmail } });
  let managerId = existingManager?.id || "";
  if (!existingManager) {
    const mgr = await prisma.adminUser.create({
      data: {
        email: managerEmail,
        passwordHash: await bcrypt.hash(managerPassword, 12),
        fullName: "مدير منصة التقنية",
        role: "PLATFORM_MANAGER" as any,
        platformId: platA.id,
      },
    });
    managerId = mgr.id;
    console.log("✅ مدير منصة:", mgr.fullName, "←", platA.name);
  } else {
    console.log("⏭️  مدير المنصة — موجود");
  }

  // ════════════ 4. إنشاء أعضاء بحسابات دخول ════════════
  const rawMemberPassword = process.env.SEED_MEMBER_PASSWORD || randomLocalPassword();
  const memberPassword = await bcrypt.hash(rawMemberPassword, 12);
  // كل عضو يُربط بمنصة عبر حقل platformId (أضيف مؤخراً)
  const sampleMembers = [
    { firstName: "أحمد", lastName: "العمري", code: "R-101", email: "ahmed@example.com", networkRole: "باحث ومفكر", platformId: platA.id },
    { firstName: "سارة", lastName: "المطيري", code: "R-102", email: "sara@example.com", networkRole: "مؤثر رقمي", platformId: platA.id },
    { firstName: "خالد", lastName: "الشهري", code: "R-103", email: "khaled@example.com", networkRole: "متطوع", platformId: platA.id },
    { firstName: "نورة", lastName: "القحطاني", code: "R-104", email: "noura@example.com", networkRole: "مشرف", platformId: platA.id },
    { firstName: "عمر", lastName: "الدوسري", code: "R-105", email: "omar@example.com", networkRole: "رئيس منصة", platformId: platA.id },
    { firstName: "فاطمة", lastName: "العتيبي", code: "R-201", email: "fatma@example.com", networkRole: "باحث ومفكر", platformId: platB.id },
    { firstName: "عبدالله", lastName: "الحربي", code: "R-202", email: "abdullah@example.com", networkRole: "مؤثر رقمي", platformId: platB.id },
    { firstName: "منى", lastName: "السعيد", code: "R-203", email: "mona@example.com", networkRole: "متطوع", platformId: platB.id },
  ];

  let memberPlatformMap = new Map<string, string>();
  for (const m of sampleMembers) {
    const existing = await (prisma as any).beneficiary.findUnique({ where: { code: m.code } });
    if (!existing) {
      const created = await (prisma as any).beneficiary.create({
        data: {
          firstName: m.firstName, lastName: m.lastName, code: m.code,
          email: m.email, networkRole: m.networkRole,
          platformId: m.platformId,
          status: "ACTIVE", type: "BENEFICIARY",
          joinDate: new Date(curYear - 1, Math.floor(Math.random() * 12), 1),
          passwordHash: memberPassword, mustChangePassword: true,
        },
      });
      memberPlatformMap.set(created.id, m.platformId);
    } else {
      // تحديث الأعضاء الحاليين بربطهم بمنصة إن لم يكونوا مرتبطين
      if (!existing.platformId) {
        await (prisma as any).beneficiary.update({ where: { id: existing.id }, data: { platformId: m.platformId } });
      }
      memberPlatformMap.set(existing.id, m.platformId);
    }
  }
  console.log(`✅ أعضاء بحسابات دخول: ${memberPlatformMap.size}`);

  // ════════════ 5. أنواع الأنشطة (إن لم تكن موجودة) ════════════
  const existingActions = await prisma.impactAction.count();
  if (existingActions < 5) {
    const actions = [
      { name: "منشور على منصة X", points: 5, category: "DIGITAL_ACTIVITY", note: "تغريدة أو منشور" },
      { name: "مقال على LinkedIn", points: 10, category: "DIGITAL_ACTIVITY", note: "مقال احترافي" },
      { name: "حضور ورشة عمل", points: 15, category: "SCIENTIFIC_EVENTS", note: "حضور فعالية علمية" },
      { name: "تنظيم ورشة عمل", points: 25, category: "SCIENTIFIC_EVENTS", note: "تنظيم وإدارة ورشة" },
      { name: "مبادرة مجتمعية", points: 30, category: "INITIATIVES", note: "مبادرة تطوعية" },
      { name: "إنتاج محتوى تعليمي", points: 20, category: "INITIATIVES", note: "فيديو أو مقال تعليمي" },
      { name: "حضور اجتماع دوري", points: 3, category: "DISCIPLINE", note: "التزام بالحضور" },
      { name: "تقديم تقرير شهري", points: 10, category: "DISCIPLINE", note: "تقرير منظم في الموعد" },
      { name: "تمثيل الشبكة في مؤتمر", points: 40, category: "SCIENTIFIC_EVENTS", note: "تمثيل رسمي" },
      { name: "تصميم جرافيك للمنصة", points: 15, category: "INITIATIVES", note: "عمل إبداعي" },
    ];
    for (const a of actions) {
      await (prisma as any).impactAction.create({ data: { ...a, isActive: true, sortOrder: 0 } });
    }
    console.log(`✅ ${actions.length} أنواع أنشطة جديدة`);
  } else {
    console.log(`⏭️  أنواع الأنشطة — ${existingActions} موجودة`);
  }

  // ════════════ 6. سجلات أثر للشهور الماضية ════════════
  // إضافة أعضاء حاليين (ليسوا في sampleMembers) لخريطة المنصة
  const existingMembers = await (prisma as any).beneficiary.findMany({
    where: { type: "BENEFICIARY", NOT: { code: { in: sampleMembers.map(m => m.code) } } },
    select: { id: true, platformId: true },
  });
  for (const em of existingMembers.slice(0, 10)) {
    const pid = em.platformId || platforms[Math.floor(Math.random() * platforms.length)].id;
    if (!em.platformId) {
      await (prisma as any).beneficiary.update({ where: { id: em.id }, data: { platformId: pid } });
    }
    memberPlatformMap.set(em.id, pid);
  }

  const allActions = await prisma.impactAction.findMany({ where: { isActive: true } });
  const qualityLevels = ["ACCEPTABLE", "GOOD", "EXCELLENT", "EXCEPTIONAL", "ACCEPTABLE"] as const;
  const statuses = ["APPROVED", "APPROVED", "APPROVED", "PENDING_REVIEW", "REJECTED"] as const;

  let newLogs = 0;
  for (const [memberId, platformId] of memberPlatformMap.entries()) {
    const numActivities = 3 + Math.floor(Math.random() * 6);
    for (let i = 0; i < numActivities; i++) {
      const action = allActions[Math.floor(Math.random() * allActions.length)];
      const quality = qualityLevels[Math.floor(Math.random() * qualityLevels.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const month = curMonth - Math.floor(Math.random() * 6);
      const year = month < 0 ? curYear - 1 : curYear;
      const actualMonth = month < 0 ? month + 12 : month;
      const day = 1 + Math.floor(Math.random() * 28);
      const date = new Date(year, actualMonth, day);

      try {
        await (prisma as any).impactLog.create({
          data: {
            beneficiaryId: memberId,
            actionId: action.id,
            count: 1 + Math.floor(Math.random() * 3),
            quality: quality as any,
            status: status as any,
            date,
            note: status === "REJECTED" ? "يحتاج توثيقاً أفضل" : null,
            rejectionReason: status === "REJECTED" ? "الرابط المرفوع لا يعمل" : null,
            approvedBy: status === "APPROVED" ? "المشرف العام" : null,
            approvedAt: status === "APPROVED" ? new Date(year, actualMonth, day + 1) : null,
            platformId,
            sourceType: "MANUAL",
            createdBy: status === "PENDING_REVIEW" ? (Math.random() > 0.5 ? "عضو" : null) : "المشرف العام",
            pointsSnapshot: status === "APPROVED" ? action.points * (1 + Math.floor(Math.random() * 2)) : null,
          },
        });
        newLogs++;
      } catch { /* تخطي التكرار */ }
    }
  }
  console.log(`✅ ${newLogs} سجل أثر جديد عبر 6 أشهر`);

  // ════════════ 7. دروع ════════════
  const badgeNames = ["درع رائد الشهر", "درع المؤثر الرقمي", "درع الباحث المنتج", "درع المتطوع المثالي", "درع العطاء المستمر"];
  let newAwards = 0;
  for (const [memberId] of memberPlatformMap.entries()) {
    if (Math.random() > 0.4 && newAwards < 8) {
      await (prisma as any).impactAward.create({
        data: {
          beneficiaryId: memberId,
          type: Math.random() > 0.5 ? "SHIELD" : "REWARD",
          title: badgeNames[Math.floor(Math.random() * badgeNames.length)],
          value: Math.random() > 0.5 ? Math.floor(Math.random() * 500) : 0,
          date: new Date(curYear, Math.floor(Math.random() * curMonth + 1), 1),
        },
      });
      newAwards++;
    }
  }
  console.log(`✅ ${newAwards} درع/مكافأة جديدة`);

  // ════════════ 8. بوابات شهرية ════════════
  for (const [memberId] of memberPlatformMap.entries()) {
    for (let m = 0; m < 3; m++) {
      const targetMonth = curMonth - m;
      const targetYear = targetMonth < 0 ? curYear - 1 : curYear;
      const actualMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
      try {
        await (prisma as any).impactGate.upsert({
          where: { beneficiaryId_year_month: { beneficiaryId: memberId, year: targetYear, month: actualMonth + 1 } },
          create: { beneficiaryId: memberId, year: targetYear, month: actualMonth + 1, passed: Math.random() > 0.15 },
          update: {},
        });
      } catch { /* تخطي */ }
    }
  }
  console.log("✅ بوابات شهرية");

  // ════════════ 9. وثائق أرشيف ════════════
  const docTypes = ["REPORT", "BUDGET", "MEETING_MINUTES", "WORK_PLAN", "NEWSLETTER"];
  const docTitles = [
    "التقرير الربعي الأول", "ميزانية النصف الأول", "محضر اجتماع اللجنة التنفيذية",
    "خطة العمل السنوية", "نشرة أخبار الشبكة", "تقرير إنجازات المنصة",
    "محضر ورشة العمل التطويرية", "خطة الربع القادم",
  ];
  const existingDocs = await (prisma as any).document.count().catch(() => 0);
  if (existingDocs === 0) {
    for (let i = 0; i < 5; i++) {
      await (prisma as any).document.create({
        data: {
          title: docTitles[i],
          type: docTypes[i % docTypes.length],
          description: `${docTitles[i]} — ${platforms[i % platforms.length].name}`,
          fileUrl: `https://example.com/docs/${i + 1}.pdf`,
          fileType: "pdf",
          fileSize: 250000 + Math.floor(Math.random() * 1000000),
          platformId: platforms[i % platforms.length].id,
          uploadedBy: i % 2 === 0 ? "المشرف العام" : "مدير المنصة",
          status: "APPROVED",
          periodYear: curYear,
          periodMonth: Math.max(1, curMonth - i),
        },
      });
    }
    console.log("✅ 5 وثائق أرشيف");
  }

  // ════════════ 10. إشعارات ════════════
  const allAdminUsers = await prisma.adminUser.findMany({ where: { isActive: true } });
  const notifications = [
    { title: "أنشطة بانتظار الاعتماد", body: "لديك 3 أنشطة جديدة تنتظر مراجعتك في المنصة", type: "NEW_SUBMISSION", link: "/admin/my-platform?tab=activities" },
    { title: "تم اعتماد نشاط", body: "أحمد العمري — منشور على منصة X (+5 نقاط)", type: "ACTIVITY_APPROVED", link: "/admin/impact?tab=activities" },
    { title: "تذكير", body: "منصة التقنية لديها أنشطة معلقة منذ 5 أيام", type: "SYSTEM_ALERT", link: "/admin/platforms-overview" },
  ];

  for (const admin of allAdminUsers.slice(0, 2)) {
    for (const n of notifications) {
      await (prisma as any).notification.create({
        data: {
          recipientId: admin.id,
          recipientType: (admin as any).role === "PLATFORM_MANAGER" ? "PLATFORM_MANAGER" : "ADMIN",
          ...n,
          isRead: Math.random() > 0.5,
          readAt: Math.random() > 0.5 ? new Date() : null,
        },
      });
    }
  }
  console.log(`✅ إشعارات`);

  // ════════════ 11. SUMMARY ════════════
  console.log("\n📊 ===== ملخص البذرة =====");
  console.log("─────────────────────────");
  console.log("🔑 بيانات الدخول التجريبية تُضبط عبر SEED_* ولا تُطبع في السجلات.");
  console.log("─────────────────────────");
  console.log("🌐 /ar/admin/login     — لوحة الإدارة");
  console.log("🌐 /ar/admin/my-platform — لوحة مدير المنصة");
  console.log("🌐 /ar/member/login    — بوابة العضو");
  console.log("✨ ==================== ✨");
}

main()
  .catch((e) => { console.error("❌ فشل:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
