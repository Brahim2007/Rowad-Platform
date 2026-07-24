import { z } from 'zod'
import { ai } from '@/lib/ai/gemini'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

export const fieldHelpKeySchema = z.enum([
  'impact.activity.type',
  'impact.activity.date',
  'impact.activity.count',
  'impact.activity.evidence',
  'impact.activity.note',
  'impact.activity.quality',
  'impact.activity.status',
  'impact.activity.source',
  'impact.activity.rejection_reason',
])

export type FieldHelpKey = z.infer<typeof fieldHelpKeySchema>

export const fieldHelpResponseSchema = z.object({
  explanation: z.string().trim().min(10).max(600),
  example: z.string().trim().min(3).max(300),
  tips: z.array(z.string().trim().min(3).max(240)).min(1).max(4),
})

export type FieldHelpResponse = z.infer<typeof fieldHelpResponseSchema>

type FieldDefinition = {
  service: string
  label: string
  context: string
  fallback: FieldHelpResponse
}

const FIELD_DEFINITIONS: Record<FieldHelpKey, FieldDefinition> = {
  'impact.activity.type': {
    service: 'impact',
    label: 'نوع النشاط',
    context: 'اختيار النشاط الذي نفذه العضو من قائمة الأنشطة المعتمدة في منظومة الأثر.',
    fallback: {
      explanation: 'اختر النشاط الأقرب لما أنجزته فعليًا؛ لأن نوع النشاط يحدد التصنيف والنقاط الأساسية قبل مراجعة مدير المنصة.',
      example: 'إذا شاركت في ندوة، اختر نشاط المشاركة العلمية المناسب بدل نشاط رقمي عام.',
      tips: ['لا تختَر نشاطًا أعلى نقاطًا إذا كان لا يطابق الإنجاز.', 'عند التردد، قارن اسم النشاط بالدليل الذي سترفقه.'],
    },
  },
  'impact.activity.date': {
    service: 'impact',
    label: 'تاريخ النشاط',
    context: 'التاريخ الفعلي الذي أُنجز أو نُشر فيه النشاط.',
    fallback: {
      explanation: 'سجّل تاريخ تنفيذ النشاط نفسه، وليس تاريخ تعبئة النموذج، حتى تظهر التقارير الشهرية في فترتها الصحيحة.',
      example: 'نشرت المقال يوم 15 مايو؛ أدخل 15 مايو حتى لو سجلته في المنصة يوم 18 مايو.',
      tips: ['ارجع إلى تاريخ النشر أو شهادة الحضور.', 'لا تستخدم تاريخًا مستقبليًا.'],
    },
  },
  'impact.activity.count': {
    service: 'impact',
    label: 'العدد',
    context: 'عدد الوحدات المتشابهة المنفذة والمثبتة بالدليل في هذا التسجيل.',
    fallback: {
      explanation: 'اكتب عدد الأنشطة المتشابهة التي يغطيها الدليل المرفق. يُضرب العدد في نقاط النشاط بعد المراجعة.',
      example: 'إذا أرفقت دليلًا يثبت نشر 3 مواد، اكتب 3.',
      tips: ['استخدم 1 لنشاط واحد.', 'لا تجمع أنشطة مختلفة في تسجيل واحد.', 'يجب أن يثبت الدليل كامل العدد.'],
    },
  },
  'impact.activity.evidence': {
    service: 'impact',
    label: 'رابط دليل النشاط',
    context: 'رابط يمكن للمراجع فتحه للتحقق من تنفيذ النشاط، مثل Google Drive أو منشور أو مقال.',
    fallback: {
      explanation: 'ضع رابطًا مباشرًا يثبت النشاط ويستطيع مدير المنصة فتحه دون طلب صلاحية إضافية.',
      example: 'رابط منشور عام، أو ملف Google Drive مضبوط على «أي شخص لديه الرابط».',
      tips: ['اختبر الرابط في نافذة خاصة قبل الإرسال.', 'تأكد أن الدليل يوضح اسم النشاط أو نتيجته وتاريخه.', 'لا تضع رابط الصفحة الرئيسية فقط.'],
    },
  },
  'impact.activity.note': {
    service: 'impact',
    label: 'ملاحظات النشاط',
    context: 'وصف موجز يساعد المراجع على فهم ما أُنجز والنتيجة المرتبطة به.',
    fallback: {
      explanation: 'اكتب ملخصًا قصيرًا يوضح ماذا أنجزت، ودورك، وأبرز نتيجة؛ ولا تكرر اسم النشاط فقط.',
      example: 'أعددت ونشرت مادة توعوية عن التطوع، ووصلت إلى 500 مشاهدة خلال أسبوع.',
      tips: ['استخدم جملة أو جملتين واضحتين.', 'اذكر النتيجة القابلة للتحقق إن وجدت.', 'لا تضع بيانات شخصية حساسة.'],
    },
  },
  'impact.activity.quality': {
    service: 'impact',
    label: 'الجودة',
    context: 'تقدير إداري لمستوى إتقان النشاط وجودة دليله وأثره.',
    fallback: {
      explanation: 'اختر مستوى الجودة بناءً على جودة التنفيذ والدليل والأثر المحقق، وليس على عدد الأنشطة وحده.',
      example: 'نشاط موثق جيدًا وحقق هدفه بوضوح يمكن تقييمه «جيد» أو أعلى بحسب معايير المنصة.',
      tips: ['استند إلى الدليل لا الانطباع.', 'طبّق المستوى نفسه على الحالات المتشابهة.', 'وثّق سبب التقدير العالي أو المنخفض في الملاحظات.'],
    },
  },
  'impact.activity.status': {
    service: 'impact',
    label: 'حالة الاعتماد',
    context: 'قرار المراجع بشأن احتساب النشاط بعد فحص بياناته ودليله.',
    fallback: {
      explanation: 'استخدم «قيد المراجعة» قبل اكتمال التحقق، و«معتمد» عند صحة النشاط والدليل، و«مرفوض» عند وجود سبب واضح.',
      example: 'إذا كان رابط الدليل لا يفتح، أبقِ النشاط قيد المراجعة أو ارفضه مع توضيح السبب وفق الإجراء المتبع.',
      tips: ['لا تعتمد النشاط قبل فتح الدليل.', 'عند الرفض اكتب سببًا يساعد العضو على التصحيح.'],
    },
  },
  'impact.activity.source': {
    service: 'impact',
    label: 'المصدر',
    context: 'القناة التي وصل منها سجل النشاط إلى المنظومة.',
    fallback: {
      explanation: 'حدد مصدر السجل ليسهل تتبعه: إدخال يدوي، مشاركة، تسجيل، تقرير، تقييم، أو مصدر خارجي.',
      example: 'اختر «يدوي» عندما أدخل المدير النشاط مباشرة من هذه النافذة.',
      tips: ['المصدر لا يعبّر عن جودة النشاط.', 'اختر القناة الفعلية التي أنشأت السجل.'],
    },
  },
  'impact.activity.rejection_reason': {
    service: 'impact',
    label: 'سبب الرفض',
    context: 'تفسير مهني واضح لعدم اعتماد النشاط وما يلزم لتصحيحه.',
    fallback: {
      explanation: 'اكتب سببًا محددًا ومحايدًا يوضح المشكلة والخطوة المطلوبة من العضو، دون أحكام شخصية.',
      example: 'رابط الدليل غير متاح للمشاهدة؛ يرجى تعديل المشاركة إلى «أي شخص لديه الرابط» ثم إعادة الإرسال.',
      tips: ['تجنب عبارة «غير صحيح» وحدها.', 'اذكر الحقل أو الدليل الذي يحتاج إلى تصحيح.', 'لا تضع بيانات حساسة.'],
    },
  },
}

export function getFieldHelpFallback(fieldKey: FieldHelpKey): FieldHelpResponse {
  return FIELD_DEFINITIONS[fieldKey].fallback
}

function parseStoredGuide(guide: { explanation: string; example: string; tipsJson: string }): FieldHelpResponse | null {
  try {
    const parsed = fieldHelpResponseSchema.safeParse({
      explanation: guide.explanation,
      example: guide.example,
      tips: JSON.parse(guide.tipsJson),
    })
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export async function generateFieldHelp(
  fieldKey: FieldHelpKey,
  userId: string,
): Promise<{ help: FieldHelpResponse; source: 'stored' | 'gemini' | 'fallback' }> {
  const definition = FIELD_DEFINITIONS[fieldKey]

  try {
    const stored = await prisma.fieldHelpGuide.findUnique({
      where: { fieldKey },
      select: { explanation: true, example: true, tipsJson: true },
    })
    if (stored) {
      const help = parseStoredGuide(stored)
      if (help) return { help, source: 'stored' }
    }
  } catch (error) {
    logger.warn('[field-help] Unable to read the shared guide store', {
      fieldKey,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  if (!process.env.GEMINI_API_KEY) {
    return { help: definition.fallback, source: 'fallback' }
  }

  try {
    const result = await ai.chat(
      `اشرح الحقل التالي لمستخدم في منصة رواد:
اسم الحقل: ${definition.label}
سياقه الموثوق: ${definition.context}

أعد JSON فقط بهذه البنية:
{
  "explanation": "شرح عربي مبسط من جملتين كحد أقصى",
  "example": "مثال عملي صحيح وقصير",
  "tips": ["نصيحة عملية", "خطأ شائع يجب تجنبه"]
}`,
      {
        system: 'أنت مساعد حقول عربي موجز لمنصة إدارية. التزم بالسياق المقدم، ولا تطلب بيانات شخصية، ولا تفترض أنك شاهدت قيمة الحقل.',
        maxTokens: 450,
        userId,
        feature: `field-help:${fieldKey}`,
        responseFormat: { type: 'json_object' },
      },
    )
    const parsed = fieldHelpResponseSchema.safeParse(JSON.parse(result.text))
    if (!parsed.success) throw new Error('Invalid field-help response')

    await prisma.fieldHelpGuide.upsert({
      where: { fieldKey },
      create: {
        service: definition.service,
        fieldKey,
        label: definition.label,
        explanation: parsed.data.explanation,
        example: parsed.data.example,
        tipsJson: JSON.stringify(parsed.data.tips),
        source: 'GEMINI',
        generatedBy: userId,
      },
      update: {},
    })

    const shared = await prisma.fieldHelpGuide.findUnique({
      where: { fieldKey },
      select: { explanation: true, example: true, tipsJson: true },
    })
    const help = shared ? parseStoredGuide(shared) : null
    if (help) return { help, source: 'stored' }
    return { help: parsed.data, source: 'gemini' }
  } catch (error) {
    logger.warn('[field-help] Gemini unavailable; serving curated fallback', {
      fieldKey,
      error: error instanceof Error ? error.message : String(error),
    })
    return { help: definition.fallback, source: 'fallback' }
  }
}
