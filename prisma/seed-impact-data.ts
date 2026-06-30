/**
 * بذرة بيانات لوحة الأثر — بيانات تجريبية واقعية
 * تشغيل: npx tsx prisma/seed-impact-data.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// توزيع المنصات على الأعضاء
const MEMBER_PLATFORMS: Record<string, string> = {
  'TM-ahmed-abdallah': 'منصة ساند الإعلامية',
  'TM-sara-mohammad': 'منصة المرأة المسلمة',
  'TM-khaled-yousef': 'منصة مفكر',
  'TM-noura-ahmed': 'منصة ساند الإعلامية',
  'TM-omar-hassan': 'المنصة التربوية الشاملة',
  'TM-lama-sami': 'منصة تمكين العمل الإنساني',
  'TM-ziad-khaled': 'منصة مفكر',
  'TM-rana-ibrahim': 'المنصة العالمية للدفاع عن حقوق الإنسان',
  'TM-maher-abbas': 'منصة كلنا دعاة',
  'TM-huda-maliki': 'منصة الإدارة والاقتصاد الإسلامي',
  'BN-mrym-alaabd-allh-81of': 'منصة المرأة المسلمة',
  'BN-fatmh-alzhra-0gz2': 'المنصة التربوية الشاملة',
  'BN-mhmd-alamyn-qer2': 'منصة تمكين العمل الإنساني',
  'BN-asma-khald-2abp': 'منصة ساند الإعلامية',
  'BN-aabd-alrhmn-alhsn-dia7': 'المنصة العالمية للدفاع عن حقوق الإنسان',
  'BN-nwr-hsan-ci6i': 'منصة مفكر',
  'BN-abrahym-alkhtyb-ejob': 'منصة أفق السياسة',
  'BN-slma-aabd-alkrym-1dgm': 'منصة كلنا دعاة',
  'BN-ans-bsharh-g4ia': 'منصة الإدارة والاقتصاد الإسلامي',
  'BN-hda-alnaaman-q0k1': 'المنصة التربوية الشاملة',
  'BN-ywsf-alghzaly-3ac9': 'منصة تمكين العمل الإنساني',
  'BN-daaa-mhmd-p4vu': 'منصة المرأة المسلمة',
  'BN-basl-alsfdy-ij03': 'منصة أفق السياسة',
  'BN-shyma-ahmd-keij': 'منصة كلنا دعاة',
  'BN-khlyl-alkhlyly-t9wr': 'المنصة العالمية للدفاع عن حقوق الإنسان',
}

// الصفات
const MEMBER_ROLES: Record<string, string> = {
  'TM-ahmed-abdallah': 'رئيس منصة',
  'TM-sara-mohammad': 'مشرف',
  'TM-khaled-yousef': 'باحث ومفكر',
  'TM-noura-ahmed': 'مؤثر رقمي',
  'TM-omar-hassan': 'مشرف',
  'TM-lama-sami': 'متطوع',
  'TM-ziad-khaled': 'باحث ومفكر',
  'TM-rana-ibrahim': 'متطوع',
  'TM-maher-abbas': 'مشرف',
  'TM-huda-maliki': 'مشرف',
  'BN-mrym-alaabd-allh-81of': 'باحث ومفكر',
  'BN-fatmh-alzhra-0gz2': 'متطوع',
  'BN-mhmd-alamyn-qer2': 'متطوع',
  'BN-asma-khald-2abp': 'مؤثر رقمي',
  'BN-aabd-alrhmn-alhsn-dia7': 'باحث ومفكر',
  'BN-nwr-hsan-ci6i': 'باحث ومفكر',
  'BN-abrahym-alkhtyb-ejob': 'رئيس منصة',
  'BN-slma-aabd-alkrym-1dgm': 'متطوع',
  'BN-ans-bsharh-g4ia': 'مؤثر رقمي',
  'BN-hda-alnaaman-q0k1': 'متطوع',
  'BN-ywsf-alghzaly-3ac9': 'مؤثر رقمي',
  'BN-daaa-mhmd-p4vu': 'باحث ومفكر',
  'BN-basl-alsfdy-ij03': 'مشرف',
  'BN-shyma-ahmd-keij': 'متطوع',
  'BN-khlyl-alkhlyly-t9wr': 'باحث ومفكر',
}

/** تاريخ قبل N من الأيام */
function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(10, 0, 0, 0)
  return d
}

/** تاريخ عشوائي خلال آخر N من الأيام */
function randDaysAgo(maxDays: number, minDays: number = 1): Date {
  return daysAgo(minDays + Math.floor(Math.random() * (maxDays - minDays)))
}

/** رقم عشوائي بين min و max */
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
  console.log('🌱 بدء زرع بيانات لوحة الأثر التجريبية...\n')

  // ═══════════════════════════════════════════════════
  // 1. تحديث الصفات ومنصة الأثر للأعضاء
  // ═══════════════════════════════════════════════════
  const beneficiaries = await prisma.beneficiary.findMany({ where: { status: 'ACTIVE' } })

  for (const b of beneficiaries) {
    const role = MEMBER_ROLES[b.code] || null
    const platformName = MEMBER_PLATFORMS[b.code] || null

    if (role || platformName) {
      await prisma.beneficiary.update({
        where: { id: b.id },
        data: {
          ...(role ? { networkRole: role } : {}),
          ...(platformName ? { impactNote: `بذرة تلقائية - ${platformName}` } : {}),
        },
      })
    }
  }
  console.log(`✅ تم تحديث صفات ${Object.keys(MEMBER_ROLES).length} عضو`)

  // ═══════════════════════════════════════════════════
  // 2. جلب كل الأنشطة (actions)
  // ═══════════════════════════════════════════════════
  const allActions = await prisma.impactAction.findMany()
  const actionByName = new Map(allActions.map(a => [a.name, a]))

  function act(name: string) {
    const a = actionByName.get(name)
    if (!a) throw new Error(`Action not found: ${name}`)
    return a
  }

  // ═══════════════════════════════════════════════════
  // 3. توليد سجلات الأثر (impact logs) واقعية لكل عضو
  // ═══════════════════════════════════════════════════
  console.log('📝 إنشاء سجلات الأثر للمستفيدين...')
  let logCount = 0

  type LogDef = [string, string, number, string, string, number?] // [code, actionName, count, quality, status, daysAgo]

  // تعريف أنشطة كل عضو — توزيع واقعي
  const memberActivities: Record<string, LogDef[]> = {
    // ⭐ أحمد عبد الله — رائد (أعلى النقاط)
    'TM-ahmed-abdallah': [
      ['منشور احترافي (مقال/تصميم/فيديو)', 8, 'EXCELLENT', 'APPROVED', 5],
      ['جذب عضو/متابع جديد', 5, 'GOOD', 'APPROVED', 15],
      ['بونص: منشور حقّق وصولًا لافتًا', 3, 'EXCEPTIONAL', 'APPROVED', 8],
      ['إعادة نشر محتوى الشبكة', 12, 'ACCEPTABLE', 'APPROVED', 3],
      ['التفاعل مع حملة من حملات الشبكة', 4, 'EXCELLENT', 'APPROVED', 20],
      ['منشور قصير أو مشاركة', 10, 'GOOD', 'APPROVED', 2],
      ['التفاعل على الواتساب / الجروبات', 15, 'GOOD', 'APPROVED', 1],
      ['تقديم محاضرة عامة', 1, 'EXCELLENT', 'APPROVED', 45],
      ['إدارة جلسة حوارية', 2, 'GOOD', 'APPROVED', 30],
      ['قيادة مبادرة أو فريق', 1, 'EXCEPTIONAL', 'APPROVED', 60],
      ['إنجاز مهمة قبل الوقت', 4, 'GOOD', 'APPROVED', 10],
      ['حضور اجتماع إداري', 8, 'ACCEPTABLE', 'APPROVED', 7],
      ['مساعدة عضو جديد', 3, 'EXCELLENT', 'APPROVED', 25],
      ['المبادرة دون تكليف', 1, 'EXCEPTIONAL', 'APPROVED', 35],
    ],
    // ⭐ سارة محمد — أداء عالي
    'TM-sara-mohammad': [
      ['كتابة مقال قصير', 5, 'GOOD', 'APPROVED', 12],
      ['كتابة مقال تحليلي طويل', 2, 'EXCELLENT', 'APPROVED', 40],
      ['إعداد ورقة بحثية', 1, 'EXCEPTIONAL', 'APPROVED', 90],
      ['المشاركة في ندوة/مؤتمر افتراضي', 3, 'GOOD', 'APPROVED', 18],
      ['حضور ورشة عمل', 4, 'EXCELLENT', 'APPROVED', 22],
      ['إنجاز مهمة في وقتها', 6, 'GOOD', 'APPROVED', 8],
      ['تسليم التقرير في وقته', 5, 'EXCELLENT', 'APPROVED', 15],
      ['الالتزام بالحضور الأسبوعي', 10, 'GOOD', 'APPROVED', 4],
      ['مساعدة عضو جديد', 2, 'GOOD', 'APPROVED', 28],
    ],
    // ⭐ خالد يوسف — باحث نشط
    'TM-khaled-yousef': [
      ['إعداد ورقة بحثية', 2, 'EXCEPTIONAL', 'APPROVED', 60],
      ['كتابة مقال تحليلي طويل', 3, 'EXCELLENT', 'APPROVED', 25],
      ['تقديم محاضرة داخلية', 2, 'GOOD', 'APPROVED', 35],
      ['إدارة جلسة حوارية', 3, 'EXCELLENT', 'APPROVED', 14],
      ['ترجمة محتوى قصير', 4, 'GOOD', 'APPROVED', 10],
      ['تفريغ محاضرة', 3, 'ACCEPTABLE', 'APPROVED', 8],
      ['تصميم عرض تقديمي', 2, 'GOOD', 'APPROVED', 20],
      ['تسليم التقرير في وقته', 4, 'GOOD', 'APPROVED', 6],
    ],
    // ⭐ نورة أحمد — مؤثرة رقمية
    'TM-noura-ahmed': [
      ['منشور احترافي (مقال/تصميم/فيديو)', 10, 'EXCELLENT', 'APPROVED', 3],
      ['بونص: منشور حقّق وصولًا لافتًا', 4, 'EXCEPTIONAL', 'APPROVED', 5],
      ['التفاعل مع حملة من حملات الشبكة', 6, 'GOOD', 'APPROVED', 14],
      ['جذب عضو/متابع جديد', 3, 'GOOD', 'APPROVED', 20],
      ['تصميم منشور/إنفوجرافيك', 8, 'EXCELLENT', 'APPROVED', 7],
      ['منشور قصير أو مشاركة', 15, 'ACCEPTABLE', 'APPROVED', 1],
      ['التفاعل على الواتساب / الجروبات', 12, 'GOOD', 'APPROVED', 2],
      ['إعادة نشر محتوى الشبكة', 20, 'ACCEPTABLE', 'APPROVED', 1],
    ],
    // ⭐ عمر حسان — مشرف منظم
    'TM-omar-hassan': [
      ['إنجاز مهمة في وقتها', 8, 'GOOD', 'APPROVED', 5],
      ['حضور اجتماع إداري', 12, 'ACCEPTABLE', 'APPROVED', 3],
      ['تسليم التقرير في وقته', 6, 'EXCELLENT', 'APPROVED', 10],
      ['مساعدة عضو جديد', 4, 'GOOD', 'APPROVED', 18],
      ['قيادة مبادرة أو فريق', 1, 'GOOD', 'APPROVED', 50],
      ['تنظيم لقاء افتراضي', 3, 'EXCELLENT', 'APPROVED', 25],
      ['الالتزام بالحضور الأسبوعي', 14, 'GOOD', 'APPROVED', 1],
      ['تصميم عرض تقديمي', 2, 'ACCEPTABLE', 'APPROVED', 30],
      ['المبادرة دون تكليف', 1, 'GOOD', 'APPROVED', 45],
    ],
    // ⭐ لمى سامي — مصممة نشطة
    'TM-lama-sami': [
      ['تصميم منشور/إنفوجرافيك', 12, 'EXCELLENT', 'APPROVED', 4],
      ['مونتاج فيديو قصير', 5, 'GOOD', 'APPROVED', 10],
      ['تصميم عرض تقديمي', 4, 'EXCELLENT', 'APPROVED', 15],
      ['مونتاج محاضرة كاملة', 2, 'GOOD', 'APPROVED', 30],
      ['إنجاز مهمة في وقتها', 6, 'GOOD', 'APPROVED', 7],
      ['مساعدة عضو جديد', 1, 'ACCEPTABLE', 'APPROVED', 20],
      ['الالتزام بالحضور الأسبوعي', 8, 'ACCEPTABLE', 'APPROVED', 2],
      ['إنجاز مهمة قبل الوقت', 2, 'EXCELLENT', 'APPROVED', 12],
    ],
    // ⭐ زياد خالد — باحث منتج
    'TM-ziad-khaled': [
      ['إعداد ورقة بحثية', 1, 'EXCEPTIONAL', 'APPROVED', 80],
      ['كتابة مقال تحليلي طويل', 2, 'EXCELLENT', 'APPROVED', 30],
      ['كتابة مقال قصير', 4, 'GOOD', 'APPROVED', 8],
      ['ترجمة محتوى قصير', 3, 'GOOD', 'APPROVED', 12],
      ['تقديم محاضرة داخلية', 1, 'EXCELLENT', 'APPROVED', 55],
      ['تفريغ محاضرة', 5, 'ACCEPTABLE', 'APPROVED', 5],
      ['تسليم التقرير في وقته', 4, 'GOOD', 'APPROVED', 3],
    ],
    // ⭐ رنا إبراهيم — متطوعة متفانية
    'TM-rana-ibrahim': [
      ['مساعدة عضو جديد', 5, 'EXCELLENT', 'APPROVED', 10],
      ['تنظيم لقاء افتراضي', 2, 'GOOD', 'APPROVED', 25],
      ['إدارة مجموعة واتساب يوميًا', 6, 'ACCEPTABLE', 'APPROVED', 2],
      ['المبادرة دون تكليف', 1, 'GOOD', 'APPROVED', 35],
      ['التفاعل مع حملة من حملات الشبكة', 4, 'GOOD', 'APPROVED', 15],
      ['جذب عضو/متابع جديد', 2, 'GOOD', 'APPROVED', 22],
      ['إنجاز مهمة في وقتها', 6, 'ACCEPTABLE', 'APPROVED', 5],
      ['تسليم التقرير في وقته', 3, 'GOOD', 'APPROVED', 8],
    ],
    // ⭐ ماهر العباس — منسق تطوع
    'TM-maher-abbas': [
      ['قيادة مبادرة أو فريق', 2, 'EXCELLENT', 'APPROVED', 40],
      ['مساعدة عضو جديد', 8, 'GOOD', 'APPROVED', 8],
      ['تنظيم لقاء افتراضي', 3, 'GOOD', 'APPROVED', 20],
      ['إدارة مجموعة واتساب يوميًا', 10, 'ACCEPTABLE', 'APPROVED', 1],
      ['حضور اجتماع إداري', 6, 'GOOD', 'APPROVED', 4],
      ['تسليم التقرير في وقته', 4, 'GOOD', 'APPROVED', 6],
      ['إنجاز مهمة في وقتها', 5, 'ACCEPTABLE', 'APPROVED', 3],
      ['إنجاز مهمة قبل الوقت', 1, 'GOOD', 'APPROVED', 55],
    ],
    // ⭐ هدى المالكي — جودة وتقييم
    'TM-huda-maliki': [
      ['تسليم التقرير في وقته', 8, 'EXCELLENT', 'APPROVED', 6],
      ['إنجاز مهمة في وقتها', 7, 'GOOD', 'APPROVED', 4],
      ['حضور اجتماع إداري', 10, 'ACCEPTABLE', 'APPROVED', 2],
      ['المبادرة دون تكليف', 1, 'GOOD', 'APPROVED', 20],
      ['مساعدة عضو جديد', 2, 'ACCEPTABLE', 'APPROVED', 15],
      ['تصميم عرض تقديمي', 3, 'GOOD', 'APPROVED', 12],
      ['الالتزام بالحضور الأسبوعي', 12, 'GOOD', 'APPROVED', 1],
    ],
    // مستفيدين إضافيين (نشاط متوسط)
    'BN-mrym-alaabd-allh-81of': [['كتابة مقال قصير', 3, 'GOOD', 'APPROVED', 10], ['حضور ورشة عمل', 2, 'EXCELLENT', 'APPROVED', 20], ['المشاركة في ندوة/مؤتمر افتراضي', 1, 'GOOD', 'APPROVED', 35], ['إنجاز مهمة في وقتها', 4, 'ACCEPTABLE', 'APPROVED', 5]],
    'BN-fatmh-alzhra-0gz2': [['تصميم منشور/إنفوجرافيك', 4, 'GOOD', 'APPROVED', 8], ['مونتاج فيديو قصير', 2, 'GOOD', 'APPROVED', 15], ['إنجاز مهمة في وقتها', 3, 'ACCEPTABLE', 'APPROVED', 4]],
    'BN-mhmd-alamyn-qer2': [['تنظيم لقاء افتراضي', 1, 'GOOD', 'APPROVED', 25], ['مساعدة عضو جديد', 3, 'GOOD', 'APPROVED', 12], ['إدارة مجموعة واتساب يوميًا', 5, 'ACCEPTABLE', 'APPROVED', 3]],
    'BN-asma-khald-2abp': [['منشور احترافي (مقال/تصميم/فيديو)', 4, 'GOOD', 'APPROVED', 6], ['التفاعل على الواتساب / الجروبات', 8, 'GOOD', 'APPROVED', 2], ['بونص: منشور حقّق وصولًا لافتًا', 1, 'EXCELLENT', 'APPROVED', 10]],
    'BN-aabd-alrhmn-alhsn-dia7': [['كتابة مقال قصير', 2, 'GOOD', 'APPROVED', 18], ['تقديم محاضرة داخلية', 1, 'GOOD', 'APPROVED', 30], ['حضور ورشة عمل', 1, 'ACCEPTABLE', 'APPROVED', 15]],
    'BN-nwr-hsan-ci6i': [['إعداد ورقة بحثية', 1, 'EXCELLENT', 'PENDING_REVIEW', 7], ['كتابة مقال تحليلي طويل', 1, 'GOOD', 'APPROVED', 25], ['ترجمة محتوى قصير', 2, 'ACCEPTABLE', 'APPROVED', 8]],
    'BN-abrahym-alkhtyb-ejob': [['قيادة مبادرة أو فريق', 1, 'EXCELLENT', 'APPROVED', 45], ['حضور اجتماع إداري', 5, 'ACCEPTABLE', 'APPROVED', 5], ['تسليم التقرير في وقته', 3, 'GOOD', 'APPROVED', 8], ['إنجاز مهمة قبل الوقت', 1, 'GOOD', 'APPROVED', 20]],
    'BN-slma-aabd-alkrym-1dgm': [['مساعدة عضو جديد', 2, 'GOOD', 'APPROVED', 14], ['تنظيم لقاء افتراضي', 1, 'ACCEPTABLE', 'APPROVED', 22], ['إنجاز مهمة في وقتها', 3, 'ACCEPTABLE', 'APPROVED', 3]],

    // نور حسان — آخر نشاط منذ 50 يوم (خامل)
    'BN-hda-alnaaman-q0k1': [['تصميم منشور/إنفوجرافيك', 2, 'GOOD', 'APPROVED', 62], ['إنجاز مهمة في وقتها', 1, 'ACCEPTABLE', 'APPROVED', 55]],

    'BN-ywsf-alghzaly-3ac9': [['منشور احترافي (مقال/تصميم/فيديو)', 3, 'GOOD', 'APPROVED', 9], ['جذب عضو/متابع جديد', 1, 'GOOD', 'APPROVED', 15], ['منشور قصير أو مشاركة', 5, 'ACCEPTABLE', 'APPROVED', 2]],
    'BN-daaa-mhmd-p4vu': [['كتابة مقال قصير', 2, 'GOOD', 'APPROVED', 14], ['حضور ورشة عمل', 2, 'ACCEPTABLE', 'APPROVED', 20]],
    'BN-basl-alsfdy-ij03': [['إنجاز مهمة في وقتها', 4, 'GOOD', 'APPROVED', 6], ['حضور اجتماع إداري', 4, 'ACCEPTABLE', 'APPROVED', 4], ['مساعدة عضو جديد', 1, 'GOOD', 'APPROVED', 18]],
    'BN-shyma-ahmd-keij': [['إدارة مجموعة واتساب يوميًا', 4, 'ACCEPTABLE', 'APPROVED', 3], ['تصميم منشور/إنفوجرافيك', 2, 'GOOD', 'APPROVED', 10], ['مساعدة عضو جديد', 1, 'GOOD', 'APPROVED', 25]],

    // أنس بشارة — آخر نشاط منذ 70 يوم (متوقف)
    'BN-ans-bsharh-g4ia': [['منشور قصير أو مشاركة', 3, 'ACCEPTABLE', 'APPROVED', 75], ['إعادة نشر محتوى الشبكة', 2, 'ACCEPTABLE', 'APPROVED', 70]],
    // خليل الخليلي — لم يبدأ بعد (لا أنشطة)
  }

  // beneficiary lookup
  const benByCode = new Map(beneficiaries.map(b => [b.code, b]))
  const qualityValues = ['WEAK', 'ACCEPTABLE', 'GOOD', 'EXCELLENT', 'EXCEPTIONAL'] as const

  // حذف السجلات القديمة أولاً
  await prisma.impactLog.deleteMany()
  console.log('  ⚡ تم مسح السجلات القديمة')

  for (const [code, defs] of Object.entries(memberActivities)) {
    const ben = benByCode.get(code)
    if (!ben) { console.log(`  ⚠️ عضو غير موجود: ${code}`); continue }

    for (const def of defs) {
      const [actionName, count, quality, status, daysAgoVal, extraDays] = def
      const action = actionByName.get(actionName)
      if (!action) { console.log(`  ⚠️ نشاط غير موجود: ${actionName}`); continue }

      const date = daysAgo(daysAgoVal)

      await prisma.impactLog.create({
        data: {
          beneficiaryId: ben.id,
          actionId: action.id,
          sourceType: 'MANUAL',
          count,
          quality: quality as any,
          status: status as any,
          date,
          note: `بذرة بيانات تجريبية - ${action.category}`,
          pointsSnapshot: null,
        },
      })
      logCount++
    }

    // إضافة بعض الأنشطة قيد المراجعة (1-2 لكل عضو نشط)
    if (Object.keys(memberActivities).slice(0, 12).includes(code)) {
      const pendingActions = allActions.filter(a => a.points > 0).slice(0, 5)
      const pending = pendingActions[Math.floor(Math.random() * pendingActions.length)]
      if (pending) {
        await prisma.impactLog.create({
          data: {
            beneficiaryId: ben.id,
            actionId: pending.id,
            sourceType: 'MANUAL',
            count: 1,
            quality: qualityValues[rand(0, 3)],
            status: 'PENDING_REVIEW',
            date: daysAgo(rand(1, 5)),
            note: 'بانتظار المراجعة',
            pointsSnapshot: null,
          },
        })
        logCount++
      }
    }
  }

  console.log(`✅ تم إنشاء ${logCount} سجل أثر`)

  // ═══════════════════════════════════════════════════
  // 4. الدروع والمكافآت
  // ═══════════════════════════════════════════════════
  console.log('🏅 إنشاء الدروع والمكافآت...')
  let awardCount = 0

  const awardsData: Array<[string, string, string, number]> = [
    // [code, type, title, daysAgo]
    ['TM-ahmed-abdallah', 'SHIELD', 'درع المؤثر الرقمي', 30],
    ['TM-ahmed-abdallah', 'SHIELD', 'درع رائد الشهر', 10],
    ['TM-ahmed-abdallah', 'SHIELD', 'جائزة القيادة', 60],
    ['TM-sara-mohammad', 'SHIELD', 'درع الباحث المنتج', 25],
    ['TM-sara-mohammad', 'SHIELD', 'جائزة الباحث الملهم', 45],
    ['TM-khaled-yousef', 'SHIELD', 'درع الباحث المنتج', 20],
    ['TM-noura-ahmed', 'SHIELD', 'درع المؤثر الرقمي', 15],
    ['TM-noura-ahmed', 'SHIELD', 'درع رائد الشهر', 5],
    ['TM-lama-sami', 'SHIELD', 'درع المتطوع المثالي', 18],
    ['TM-rana-ibrahim', 'SHIELD', 'درع العطاء المستمر', 22],
    ['TM-rana-ibrahim', 'SHIELD', 'درع المتطوع المثالي', 50],
    ['TM-omar-hassan', 'SHIELD', 'درع القيادة', 35],
    ['TM-maher-abbas', 'SHIELD', 'درع العضو الصاعد', 12],
    ['TM-huda-maliki', 'SHIELD', 'درع الوفاء', 40],
    ['BN-abrahym-alkhtyb-ejob', 'SHIELD', 'درع القيادة', 28],
    // مكافآت مالية
    ['TM-ahmed-abdallah', 'REWARD', 'مكافأة الأداء المتميز - الربع الأول', 55],
    ['TM-sara-mohammad', 'REWARD', 'مكافأة البحث العلمي', 70],
    ['TM-noura-ahmed', 'REWARD', 'مكافأة التميز الإعلامي', 20],
  ]

  for (const [code, type, title, daysAgoVal] of awardsData) {
    const ben = benByCode.get(code)
    if (!ben) continue

    await prisma.impactAward.create({
      data: {
        beneficiaryId: ben.id,
        type: type as any,
        title,
        value: type === 'REWARD' ? rand(100, 500) : 0,
        date: daysAgo(daysAgoVal),
        note: 'بذرة بيانات تجريبية',
      },
    })
    awardCount++
  }
  console.log(`✅ تم إنشاء ${awardCount} درع ومكافأة`)

  // ═══════════════════════════════════════════════════
  // 5. البوابات الشهرية — آخر 6 أشهر لكل عضو
  // ═══════════════════════════════════════════════════
  console.log('🚪 إنشاء البوابات الشهرية...')
  let gateCount = 0

  const now = new Date()
  for (const ben of beneficiaries) {
    for (let m = 0; m < 6; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
      const year = d.getFullYear()
      const month = d.getMonth() + 1

      // اغلب الاعضاء يجتازون البوابة، بعضهم لا (لإظهار التباين)
      const passed = Math.random() > 0.15

      await prisma.impactGate.upsert({
        where: { beneficiaryId_year_month: { beneficiaryId: ben.id, year, month } },
        create: { beneficiaryId: ben.id, year, month, passed },
        update: { passed },
      })
      gateCount++
    }
  }
  console.log(`✅ تم إنشاء ${gateCount} بوابة شهرية`)

  // ═══════════════════════════════════════════════════
  // 6. إعدادات لوحة الأثر (تأكيد الوجود)
  // ═══════════════════════════════════════════════════
  const existingSettings = await prisma.impactSettings.findUnique({ where: { id: 1 } })
  if (!existingSettings) {
    await prisma.impactSettings.create({
      data: {
        id: 1,
        qualityBonus: JSON.stringify({ 'WEAK': -3, 'ACCEPTABLE': 0, 'GOOD': 3, 'EXCELLENT': 6, 'EXCEPTIONAL': 10 }),
        levels: JSON.stringify([
          { name: 'عضو جديد', from: 0, to: 99, desc: 'في بداية الرحلة' },
          { name: 'عضو نشط', from: 100, to: 299, desc: 'يشارك بشكل مقبول' },
          { name: 'عضو مؤثر', from: 300, to: 599, desc: 'له حضور واضح' },
          { name: 'عضو متميز', from: 600, to: 999, desc: 'من أصحاب الأداء العالي' },
          { name: 'رائد ذهبي', from: 1000, to: 1999, desc: 'من أعمدة الشبكة' },
          { name: 'سفير الرواد', from: 2000, to: 9999999, desc: 'عضو استراتيجي ومؤثر جدًا' },
        ]),
        rewardTiers: JSON.stringify([
          { name: 'لا مكافأة', from: 0, to: 99 },
          { name: 'رمزية', from: 100, to: 149 },
          { name: 'أساسية', from: 150, to: 249 },
          { name: 'متوسطة', from: 250, to: 399 },
          { name: 'كاملة + درع', from: 400, to: 9999999 },
        ]),
        umrah: JSON.stringify({ minYearly: 3000, minMonths: 9, minInitiatives: 1, requireExcellent: true, noViolations: true }),
      },
    })
    console.log('✅ إعدادات لوحة الأثر الافتراضية')
  }

  // ═══════════════════════════════════════════════════
  // المجموع النهائي
  // ═══════════════════════════════════════════════════
  const [totalLogs, totalAwards, totalGates] = await Promise.all([
    prisma.impactLog.count(),
    prisma.impactAward.count(),
    prisma.impactGate.count(),
  ])

  console.log('\n' + '='.repeat(50))
  console.log('🎉 تم زرع بيانات لوحة الأثر بنجاح!')
  console.log('='.repeat(50))
  console.log(`   📝 سجلات الأثر: ${totalLogs}`)
  console.log(`   🏅 الدروع والمكافآت: ${totalAwards}`)
  console.log(`   🚪 البوابات الشهرية: ${totalGates}`)
  console.log(`   👥 الأعضاء: ${beneficiaries.length}`)
  console.log(`   ⚙️  أنواع الأنشطة: ${allActions.length}`)
  console.log('='.repeat(50))
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
