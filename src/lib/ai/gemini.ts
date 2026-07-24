/**
 * عميل Gemini API الموحّد عبر واجهة OpenAI المتوافقة
 *
 * الاستخدام:
 *   import { ai } from '@/lib/ai/gemini'
 *   const result = await ai.chat('اكتب ملخصاً...', { system: 'أنت مساعد...', maxTokens: 500 })
 *
 * متغيرات البيئة:
 *   GEMINI_API_KEY  — مفتاح API
 *   GEMINI_BASE_URL — (اختياري) الرابط الأساسي المتوافق مع OpenAI
 *   GEMINI_MODEL    — (اختياري) اسم النموذج، الافتراضي: gemini-3.5-flash
 *   GEMINI_INPUT_PRICE_PER_MILLION / GEMINI_OUTPUT_PRICE_PER_MILLION
 *                    — (اختياري) أسعار الخطة المدفوعة؛ تبقى صفراً للخطة المجانية
 *   AI_MONTHLY_BUDGET — (اختياري) السقف الشهري بالدولار، الافتراضي: 5.00
 */

import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { platformSmartImpactReportSchema, smartImpactReportSchema, type ImpactReportMetrics, type SmartImpactReport } from '@/lib/ai/impact-report'

// ═══════════════════════════════════════════════════
// الإعدادات
// ═══════════════════════════════════════════════════

const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
const MONTHLY_BUDGET = Number(process.env.AI_MONTHLY_BUDGET) || 5.00

// الخطة المجانية تكلفتها صفر. عند تفعيل الفوترة تُضبط الأسعار من متغيرات البيئة.
const COST_PER_1K_INPUT = (Number(process.env.GEMINI_INPUT_PRICE_PER_MILLION) || 0) / 1000
const COST_PER_1K_OUTPUT = (Number(process.env.GEMINI_OUTPUT_PRICE_PER_MILLION) || 0) / 1000

// ═══════════════════════════════════════════════════
// العميل
// ═══════════════════════════════════════════════════

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('[gemini] GEMINI_API_KEY غير مضبوط — الـ API سيفشل حتى يُضبط المفتاح')
    }
  }
  return new OpenAI({ baseURL: GEMINI_BASE_URL, apiKey: apiKey || 'gemini-placeholder' })
}

// ═══════════════════════════════════════════════════
// تتبع الاستهلاك
// ═══════════════════════════════════════════════════

async function logUsage(params: {
  userId: string; feature: string; inputTokens: number; outputTokens: number; success: boolean
}) {
  try {
    const cost = (params.inputTokens / 1000) * COST_PER_1K_INPUT + (params.outputTokens / 1000) * COST_PER_1K_OUTPUT
    await prisma.aiUsageLog.create({
      data: {
        userId: params.userId,
        feature: params.feature,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        costEstimate: Math.round(cost * 1000000) / 1000000, // 6 decimals
        success: params.success,
      },
    })
  } catch { /* table may not exist yet */ }
}

async function checkBudget(): Promise<boolean> {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const result = await prisma.aiUsageLog.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { costEstimate: true },
    })
    const spent = result?._sum?.costEstimate || 0
    return spent < MONTHLY_BUDGET
  } catch {
    return true // table may not exist yet
  }
}

// ═══════════════════════════════════════════════════
// الواجهة العامة
// ═══════════════════════════════════════════════════

interface ChatOptions {
  system?: string
  maxTokens?: number
  temperature?: number
  userId?: string
  feature?: string
  responseFormat?: { type: 'json_object' }
}

export const ai = {
  /**
   * محادثة عامة — ترسل prompt وتستقبل رداً
   */
  async chat(prompt: string, opts: ChatOptions = {}) {
    const client = getClient()
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
    if (opts.system) messages.push({ role: 'system', content: opts.system })
    messages.push({ role: 'user', content: prompt })

    try {
      const response = await client.chat.completions.create({
        model: GEMINI_MODEL,
        messages,
        max_tokens: opts.maxTokens ?? 800,
        reasoning_effort: 'low',
        ...(opts.responseFormat && { response_format: opts.responseFormat }),
      })

      const usage = response.usage
      if (opts.userId && usage) {
        await logUsage({
          userId: opts.userId,
          feature: opts.feature || 'chat',
          inputTokens: usage.prompt_tokens || 0,
          outputTokens: usage.completion_tokens || 0,
          success: true,
        })
      }

      return {
        text: response.choices[0]?.message?.content || '',
        usage: usage ? { input: usage.prompt_tokens, output: usage.completion_tokens } : null,
        finishReason: response.choices[0]?.finish_reason || null,
      }
    } catch (error: unknown) {
      logger.error('[gemini] chat error', error instanceof Error ? error.message : error)
      if (opts.userId) {
        await logUsage({ userId: opts.userId, feature: opts.feature || 'chat', inputTokens: 0, outputTokens: 0, success: false })
      }
      throw error
    }
  },

  /**
   * توليد ملخص تقرير عربي
   */
  async reportSummary(data: {
    periodName: string; totalPoints: number; activeMembers: number; totalActivities: number
    topMember: string; topMemberPoints: number; topPlatform: string; topPlatformApproved: number
    memberCount: number; platformCount: number; pendingCount: number
  }, userId: string): Promise<string> {
    const withinBudget = await checkBudget()
    if (!withinBudget) throw new Error('Budget exceeded')

    const prompt = `اكتب فقرة واحدة بالعربية (3-5 جمل، أسلوب احترافي صحفي) تلخص أداء شبكة رواد الإلكترونية للفترة: ${data.periodName}.

البيانات:
- إجمالي النقاط: ${data.totalPoints}
- الأعضاء المتفاعلون: ${data.activeMembers} من أصل ${data.memberCount}
- إجمالي الأنشطة: ${data.totalActivities}
- الأنشطة المعلقة: ${data.pendingCount}
- العضو المتصدر: ${data.topMember} (${data.topMemberPoints} نقطة)
- المنصة الأنشط: ${data.topPlatform} (${data.topPlatformApproved} نشاط معتمد)
- عدد المنصات: ${data.platformCount}

اكتب الفقرة فقط، لا تضع عناوين أو تنسيق.`

    const result = await this.chat(prompt, {
      system: 'أنت محلل بيانات محترف يكتب تقارير موجزة بالعربية الفصحى الأنيقة. استخدم لغة واضحة ومباشرة.',
      temperature: 0.5,
      maxTokens: 400,
      userId,
      feature: 'report-summary',
    })

    return result.text
  },

  /**
   * تحليل اتجاهات التقرير
   */
  async reportAnalysis(data: {
    periodName: string
    current: { totalPoints: number; activeMembers: number; totalActivities: number }
    previous: { totalPoints: number; activeMembers: number; totalActivities: number }
    platforms: Array<{ name: string; current: number; previous: number }>
  }, userId: string): Promise<{ comparison: string; trends: string[] }> {
    const withinBudget = await checkBudget()
    if (!withinBudget) throw new Error('Budget exceeded')

    const prompt = `حلل أداء شبكة رواد الإلكترونية للفترة: ${data.periodName}.

الشهر الحالي: ${data.current.totalPoints} نقطة، ${data.current.activeMembers} عضو نشط، ${data.current.totalActivities} نشاط.
الشهر السابق: ${data.previous.totalPoints} نقطة، ${data.previous.activeMembers} عضو نشط، ${data.previous.totalActivities} نشاط.

أداء المنصات (الشهر الحالي vs السابق):
${data.platforms.map(p => `- ${p.name}: ${p.current} نشاط (السابق: ${p.previous})`).join('\n')}

أجب بصيغة JSON فقط بدون أي نص إضافي:
{
  "comparison": "فقرة عربية واحدة تقارن الشهر الحالي بالسابق وتفسر الفروق",
  "trends": ["ملاحظة 1 بالعربية", "ملاحظة 2 بالعربية", "ملاحظة 3 بالعربية"]
}`

    const result = await this.chat(prompt, {
      system: 'أنت محلل بيانات. أجب بصيغة JSON فقط. اكتب كل المحتوى بالعربية.',
      temperature: 0.3,
      maxTokens: 600,
      userId,
      feature: 'report-analysis',
    })

    try {
      const json = JSON.parse(result.text)
      return { comparison: json.comparison || '', trends: json.trends || [] }
    } catch {
      return { comparison: result.text, trends: [] }
    }
  },

  /**
   * تقرير أثر إداري موسّع مبني حصراً على مؤشرات محسوبة في الخادم.
   */
  async impactReport(
    metrics: ImpactReportMetrics,
    userId: string,
    context: { scope: 'network' | 'platform'; platformName?: string },
  ): Promise<SmartImpactReport> {
    const withinBudget = await checkBudget()
    if (!withinBudget) throw new Error('Budget exceeded')

    const scopeInstruction = context.scope === 'platform'
      ? `هذا تقرير تقويمي تنفيذي لمنصة "${context.platformName || 'المنصة'}" فقط. حلّل أداء هذه المنصة وأعضائها وحدها، ولا تصفه كتقرير الشبكة الكلي ولا تنشئ مقارنات بين منصات غير موجودة.
قوّم حالة المنصة بوضوح، واستخرج المشكلات الحرجة من المؤشرات المقدمة فقط. لكل مشكلة اذكر دليلها وأثرها والحل المقترح والتحرك الفوري.
أنشئ خطة تحرك سريع مرتبة بالأولوية، وحدد المسؤول بصفته والمدة ومؤشر نجاح قابلًا للقياس. إذا لم تدعم البيانات وجود مشكلة حرجة فأعد criticalIssues فارغة ولا تخترع مشكلة.`
      : 'هذا تقرير أداء شبكة رواد الكلي. حلّل بيانات الشبكة كاملة وقارن أداء المنصات الواردة فيها.'
    const platformOutputFields = context.scope === 'platform'
      ? `,
  "platformEvaluation": {
    "overallStatus": "مستقرة أو تحتاج متابعة أو تحتاج تدخل أو حرجة",
    "summary": "حكم تقويمي تنفيذي مبرر بالمؤشرات",
    "strengths": ["نقاط القوة المدعومة بالبيانات"],
    "gaps": ["فجوات الأداء المدعومة بالبيانات"]
  },
  "criticalIssues": [{
    "title": "المشكلة",
    "severity": "حرجة أو عالية أو متوسطة",
    "evidence": "الدليل الرقمي من البيانات",
    "impact": "الأثر المتوقع على المنصة",
    "recommendedSolution": "الحل العملي",
    "immediateAction": "الخطوة التي يجب تنفيذها الآن"
  }],
  "rapidActionPlan": [{
    "priority": 1,
    "action": "الإجراء المحدد",
    "ownerRole": "مدير المنصة أو إدارة النظام أو مدير المنصة وإدارة النظام",
    "timeframe": "خلال 24 ساعة أو خلال 3 أيام أو خلال 7 أيام أو خلال 30 يومًا",
    "successMeasure": "مؤشر قابل للقياس للتحقق من الإنجاز"
  }]`
      : ''

    const prompt = `أنشئ تقريراً إدارياً تحليلياً باللغة العربية اعتماداً حصراً على بيانات JSON التالية.
${scopeInstruction}
لا تخترع أرقاماً أو أسباباً غير موجودة. عند غياب المقارنة أو ضعف البيانات اذكر ذلك بوضوح في dataNotes.
اجعل التوصيات عملية وقابلة للقياس، وافصل بين الحقائق والتفسير.

البيانات:
${JSON.stringify(metrics, null, 2)}

أعد JSON صالحاً فقط دون markdown بهذا الشكل:
{
  "title": "عنوان التقرير والفترة",
  "executiveSummary": "ملخص تنفيذي من 4 إلى 6 جمل",
  "performanceNarrative": "قراءة تحليلية للمؤشرات والمقارنة بالفترة السابقة",
  "highlights": ["3 إلى 6 نقاط نجاح مدعومة بالأرقام"],
  "risks": ["0 إلى 6 مخاطر أو تنبيهات مدعومة بالبيانات"],
  "recommendations": [{"title":"عنوان مختصر","action":"إجراء محدد قابل للتنفيذ","priority":"عالية أو متوسطة أو منخفضة"}],
  "platformInsights": ["رؤى مقارنة عن المنصات دون اختلاق أسباب"],
  "memberInsights": ["رؤى عن التفاعل والمتصدرين والخمول"],
  "nextPeriodFocus": ["3 إلى 5 أولويات للفترة القادمة"],
  "dataNotes": ["قيود جودة البيانات أو المقارنة"]${platformOutputFields}
}`

    const result = await this.chat(prompt, {
      system: context.scope === 'platform'
        ? 'أنت محلل أداء تنفيذي لمنصة محددة ضمن شبكة رواد. لا تخلط أداء المنصة بأداء الشبكة الكلي، والتزم بالأرقام المقدمة.'
        : 'أنت محلل أداء تنفيذي لشبكة رواد. هذا تقرير الشبكة الكلي؛ التزم بالأرقام المقدمة، واكتب بالعربية الفصحى.',
      temperature: 0.2,
      maxTokens: context.scope === 'platform' ? 8000 : 6000,
      userId,
      feature: context.scope === 'platform' ? 'platform-performance-report' : 'network-performance-report',
      responseFormat: { type: 'json_object' },
    })

    if (result.finishReason === 'length') {
      throw new Error('AI report response was truncated')
    }
    const normalized = result.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const responseSchema = context.scope === 'platform'
      ? platformSmartImpactReportSchema
      : smartImpactReportSchema
    const parsed = responseSchema.safeParse(JSON.parse(normalized))
    if (!parsed.success) {
      logger.error('[gemini] invalid impact report structure', parsed.error.flatten())
      throw new Error('Invalid AI report structure')
    }
    return parsed.data
  },

  /**
   * مساعد الإدارة — إجابة على سؤال بلغة طبيعية
   */
  async assistant(question: string, contextData: Record<string, unknown>, userId: string): Promise<string> {
    const withinBudget = await checkBudget()
    if (!withinBudget) throw new Error('Budget exceeded')

    const context = JSON.stringify(contextData, null, 2)

    const result = await this.chat(
      `بيانات النظام الحالية:\n${context}\n\nسؤال المستخدم: ${question}\n\nأجب بالعربية، إجابة مختصرة ومفيدة. لا تخترع بيانات غير موجودة في السياق أعلاه.`,
      {
        system: 'أنت مساعد إداري لمنصة "شبكة رواد الإلكترونية". تجيب بالعربية فقط بناءً على البيانات المعطاة. لا تختلق أرقاماً أو أسماء غير موجودة في البيانات.',
        temperature: 0.3,
        maxTokens: 500,
        userId,
        feature: 'assistant',
      }
    )

    return result.text
  },

  /** التحقق من توفر API key */
  isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY
  },
}
