import { z } from 'zod'
import { ai } from '@/lib/ai/gemini'
import { logger } from '@/lib/logger'

export const fieldHelpKeySchema = z.enum([
  'activity_type',
  'activity_date',
  'activity_count',
  'activity_evidence',
  'activity_note',
  'activity_quality',
  'activity_status',
  'activity_source',
  'activity_rejection_reason',
])

export type FieldHelpKey = z.infer<typeof fieldHelpKeySchema>

export const fieldHelpResponseSchema = z.object({
  explanation: z.string().trim().min(10).max(600),
  example: z.string().trim().min(3).max(300),
  tips: z.array(z.string().trim().min(3).max(240)).min(1).max(4),
})

export type FieldHelpResponse = z.infer<typeof fieldHelpResponseSchema>

type FieldDefinition = {
  label: string
  context: string
  fallback: FieldHelpResponse
}

const FIELD_DEFINITIONS: Record<FieldHelpKey, FieldDefinition> = {
  activity_type: {
    label: 'نوع النشاط',
    context: 'اختيار النشاط الذي نفذه العضو من قائمة الأنشطة المعتمدة في منظومة الأثر.',
    fallback: {
      explanation: 'اختر النشاط الأقرب لما أنجزته فعليًا؛ لأن نوع النشاط يحدد التصنيف والنقاط الأساسية قبل مراجعة مدير المنصة.',
      example: 'إذا شاركت في ندوة، اختر نشاط المشاركة العلمية المناسب بدل نشاط رقمي عام.',
      tips: ['لا تختَر نشاطًا أعلى نقاطًا إذا كان لا يطابق الإنجاز.', 'عند التردد، قارن اسم النشاط بالدليل الذي سترفقه.'],
    },
  },
  activity_date: {
    label: 'تاريخ النشاط',
    context: 'التاريخ الفعلي الذي أُنجز أو نُشر فيه النشاط.',
    fallback: {
      explanation: 'سجّل تاريخ تنفيذ النشاط نفسه، وليس تاريخ تعبئة النموذج، حتى تظهر التقارير الشهرية في فترتها الصحيحة.',
      example: 'نشرت المقال يوم 15 مايو؛ أدخل 15 مايو حتى لو سجلته في المنصة يوم 18 مايو.',
      tips: ['ارجع إلى تاريخ النشر أو شهادة الحضور.', 'لا تستخدم تاريخًا مستقبليًا.'],
    },
  },
  activity_count: {
    label: 'العدد',
    context: 'عدد الوحدات المتشابهة المنفذة والمثبتة بالدليل في هذا التسجيل.',
    fallback: {
      explanation: 'اكتب عدد الأنشطة المتشابهة التي يغطيها الدليل المرفق. يُضرب العدد في نقاط النشاط بعد المراجعة.',
      example: 'إذا أرفقت دليلًا يثبت نشر 3 مواد، اكتب 3.',
      tips: ['استخدم 1 لنشاط واحد.', 'لا تجمع أنشطة مختلفة في تسجيل واحد.', 'يجب أن يثبت الدليل كامل العدد.'],
    },
  },
  activity_evidence: {
    label: 'رابط دليل النشاط',
    context: 'رابط يمكن للمراجع فتحه للتحقق من تنفيذ النشاط، مثل Google Drive أو منشور أو مقال.',
    fallback: {
      explanation: 'ضع رابطًا مباشرًا يثبت النشاط ويستطيع مدير المنصة فتحه دون طلب صلاحية إضافية.',
      example: 'رابط منشور عام، أو ملف Google Drive مضبوط على «أي شخص لديه الرابط».',
      tips: ['اختبر الرابط في نافذة خاصة قبل الإرسال.', 'تأكد أن الدليل يوضح اسم النشاط أو نتيجته وتاريخه.', 'لا تضع رابط الصفحة الرئيسية فقط.'],
    },
  },
  activity_note: {
    label: 'ملاحظات النشاط',
    context: 'وصف موجز يساعد المراجع على فهم ما أُنجز والنتيجة المرتبطة به.',
    fallback: {
      explanation: 'اكتب ملخصًا قصيرًا يوضح ماذا أنجزت، ودورك، وأبرز نتيجة؛ ولا تكرر اسم النشاط فقط.',
      example: 'أعددت ونشرت مادة توعوية عن التطوع، ووصلت إلى 500 مشاهدة خلال أسبوع.',
      tips: ['استخدم جملة أو جملتين واضحتين.', 'اذكر النتيجة القابلة للتحقق إن وجدت.', 'لا تضع بيانات شخصية حساسة.'],
    },
  },
  activity_quality: {
    label: 'الجودة',
    context: 'تقدير إداري لمستوى إتقان النشاط وجودة دليله وأثره.',
    fallback: {
      explanation: 'اختر مستوى الجودة بناءً على جودة التنفيذ والدليل والأثر المحقق، وليس على عدد الأنشطة وحده.',
      example: 'نشاط موثق جيدًا وحقق هدفه بوضوح يمكن تقييمه «جيد» أو أعلى بحسب معايير المنصة.',
      tips: ['استند إلى الدليل لا الانطباع.', 'طبّق المستوى نفسه على الحالات المتشابهة.', 'وثّق سبب التقدير العالي أو المنخفض في الملاحظات.'],
    },
  },
  activity_status: {
    label: 'حالة الاعتماد',
    context: 'قرار المراجع بشأن احتساب النشاط بعد فحص بياناته ودليله.',
    fallback: {
      explanation: 'استخدم «قيد المراجعة» قبل اكتمال التحقق، و«معتمد» عند صحة النشاط والدليل، و«مرفوض» عند وجود سبب واضح.',
      example: 'إذا كان رابط الدليل لا يفتح، أبقِ النشاط قيد المراجعة أو ارفضه مع توضيح السبب وفق الإجراء المتبع.',
      tips: ['لا تعتمد النشاط قبل فتح الدليل.', 'عند الرفض اكتب سببًا يساعد العضو على التصحيح.'],
    },
  },
  activity_source: {
    label: 'المصدر',
    context: 'القناة التي وصل منها سجل النشاط إلى المنظومة.',
    fallback: {
      explanation: 'حدد مصدر السجل ليسهل تتبعه: إدخال يدوي، مشاركة، تسجيل، تقرير، تقييم، أو مصدر خارجي.',
      example: 'اختر «يدوي» عندما أدخل المدير النشاط مباشرة من هذه النافذة.',
      tips: ['المصدر لا يعبّر عن جودة النشاط.', 'اختر القناة الفعلية التي أنشأت السجل.'],
    },
  },
  activity_rejection_reason: {
    label: 'سبب الرفض',
    context: 'تفسير مهني واضح لعدم اعتماد النشاط وما يلزم لتصحيحه.',
    fallback: {
      explanation: 'اكتب سببًا محددًا ومحايدًا يوضح المشكلة والخطوة المطلوبة من العضو، دون أحكام شخصية.',
      example: 'رابط الدليل غير متاح للمشاهدة؛ يرجى تعديل المشاركة إلى «أي شخص لديه الرابط» ثم إعادة الإرسال.',
      tips: ['تجنب عبارة «غير صحيح» وحدها.', 'اذكر الحقل أو الدليل الذي يحتاج إلى تصحيح.', 'لا تضع بيانات حساسة.'],
    },
  },
}

const helpCache = new Map<FieldHelpKey, FieldHelpResponse>()

export function getFieldHelpFallback(fieldKey: FieldHelpKey): FieldHelpResponse {
  return FIELD_DEFINITIONS[fieldKey].fallback
}

export async function generateFieldHelp(
  fieldKey: FieldHelpKey,
  userId: string,
): Promise<{ help: FieldHelpResponse; source: 'gemini' | 'fallback' }> {
  const cached = helpCache.get(fieldKey)
  if (cached) return { help: cached, source: 'gemini' }

  const definition = FIELD_DEFINITIONS[fieldKey]
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
    helpCache.set(fieldKey, parsed.data)
    return { help: parsed.data, source: 'gemini' }
  } catch (error) {
    logger.warn('[field-help] Gemini unavailable; serving curated fallback', {
      fieldKey,
      error: error instanceof Error ? error.message : String(error),
    })
    return { help: definition.fallback, source: 'fallback' }
  }
}
