import { PrismaClient } from '@prisma/client';
/** @type {any} */
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 إكمال البذرة السريعة...');
  const platforms = await prisma.platform.findMany({ where: { isActive: true }, take: 3 });
  const admins = await prisma.adminUser.findMany({ where: { isActive: true }, select: { id: true, role: true } });
  const allBen = await prisma.beneficiary.findMany({ where: { status: 'ACTIVE' }, select: { id: true, platformId: true }, take: 20 });
  const actions = await prisma.impactAction.findMany({ where: { isActive: true } });
  const now = new Date();

  // 1. ربط الأعضاء غير المرتبطين بمنصة
  let fixed = 0;
  for (const b of allBen) {
    if (!b.platformId) {
      await prisma.beneficiary.update({ where: { id: b.id }, data: { platformId: platforms[Math.floor(Math.random() * platforms.length)].id } });
      fixed++;
    }
  }
  console.log('✅ ربط', fixed, 'عضو بمنصة');

  // 2. سجلات أثر خفيفة (3 لكل عضو)
  const qualities = ['ACCEPTABLE', 'GOOD', 'GOOD', 'EXCELLENT', 'EXCEPTIONAL'];
  const statuses = ['APPROVED', 'APPROVED', 'APPROVED', 'PENDING_REVIEW'];
  let logs = 0;
  for (const b of allBen) {
    for (let i = 0; i < 3; i++) {
      const a = actions[Math.floor(Math.random() * actions.length)];
      const d = new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random() * 3), 1 + Math.floor(Math.random() * 28));
      try {
        await prisma.impactLog.create({
          data: {
            beneficiaryId: b.id, actionId: a.id, count: 1,
            quality: qualities[Math.floor(Math.random() * qualities.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            date: d, platformId: b.platformId || platforms[0].id, sourceType: 'MANUAL',
          },
        });
        logs++;
      } catch (e) { /* skip duplicate unique constraint */ }
    }
  }
  console.log('✅', logs, 'سجل أثر جديد');

  // 3. وثائق
  const titles = ['التقرير الربعي الأول', 'ميزانية النصف الأول', 'محضر اجتماع اللجنة', 'خطة العمل السنوية', 'نشرة أخبار الشبكة'];
  const types = ['REPORT', 'BUDGET', 'MEETING_MINUTES', 'WORK_PLAN', 'NEWSLETTER'];
  for (let i = 0; i < 5; i++) {
    try {
      await prisma.document.create({
        data: {
          title: titles[i], type: types[i],
          fileUrl: 'https://example.com/doc-' + (i + 1) + '.pdf',
          fileType: 'pdf', fileSize: 250000,
          platformId: platforms[i % platforms.length].id,
          uploadedBy: 'المشرف العام', status: 'APPROVED',
          periodYear: now.getFullYear(), periodMonth: Math.max(1, now.getMonth() - i),
        },
      });
    } catch (e) { }
  }
  console.log('✅ وثائق');

  // 4. إشعارات
  const notifs = [
    { title: 'أنشطة بانتظار الاعتماد', body: 'لديك 3 أنشطة جديدة تنتظر مراجعتك', type: 'NEW_SUBMISSION', link: '/admin/my-platform?tab=activities' },
    { title: 'تم اعتماد نشاط', body: 'أحمد العمري — منشور (+5 نقاط)', type: 'ACTIVITY_APPROVED', link: '/admin/impact?tab=activities' },
    { title: 'تذكير', body: 'منصة التقنية لديها أنشطة معلقة منذ 5 أيام', type: 'SYSTEM_ALERT', link: '/admin/platforms-overview' },
  ];
  for (const admin of admins.slice(0, 2)) {
    for (const n of notifs) {
      await prisma.notification.create({
        data: {
          recipientId: admin.id,
          recipientType: admin.role === 'PLATFORM_MANAGER' ? 'PLATFORM_MANAGER' : 'ADMIN',
          ...n, isRead: Math.random() > 0.5,
        },
      });
    }
  }
  console.log('✅ إشعارات');

  // إحصائيات
  const [benC, logC, docC, notifC] = await Promise.all([
    prisma.beneficiary.count(), prisma.impactLog.count(),
    prisma.document.count(), prisma.notification.count(),
  ]);
  console.log('\n📊 === الحالة النهائية ===');
  console.log('   أعضاء:', benC, '| سجلات:', logC, '| وثائق:', docC, '| إشعارات:', notifC);
  console.log('🔑 admin@rowad-network.org / Admin@2024!');
  console.log('🔑 manager@rowad-network.org / Manager@2024!');
  console.log('🔑 عضو: ahmed@example.com / Member@2024!');
}

seed().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
