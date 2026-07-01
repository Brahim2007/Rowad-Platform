/**
 * عميل DeepSeek API الموحّد — متوافق مع OpenAI SDK
 *
 * الاستخدام:
 *   import { ai } from '@/lib/ai/deepseek'
 *   const result = await ai.chat('اكتب ملخصاً...', { system: 'أنت مساعد...', maxTokens: 500 })
 *
 * متغيرات البيئة:
 *   DEEPSEEK_API_KEY  — مفتاح API
 *   DEEPSEEK_BASE_URL — (اختياري) الرابط الأساسي، الافتراضي: https://api.deepseek.com/v1
 *   DEEPSEEK_MODEL    — (اختياري) اسم النموذج، الافتراضي: deepseek-chat
 *   AI_MONTHLY_BUDGET — (اختياري) السقف الشهري بالدولار، الافتراضي: 5.00
 */

import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'

// ═══════════════════════════════════════════════════
// الإعدادات
// ═══════════════════════════════════════════════════

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
const MONTHLY_BUDGET = Number(process.env.AI_MONTHLY_BUDGET) || 5.00

// تقدير تكلفة تقريبي لكل 1K tokens
const COST_PER_1K_INPUT = 0.00027   // $0.27 per 1M input tokens
const COST_PER_1K_OUTPUT = 0.0011   // $1.10 per 1M output tokens

// ═══════════════════════════════════════════════════
// العميل
// ═══════════════════════════════════════════════════

function getClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[deepseek] DEEPSEEK_API_KEY غير مضبوط — الـ API سيفشل حتى يُضبط المفتاح')
    }
  }
  return new OpenAI({ baseURL: DEEPSEEK_BASE_URL, apiKey: apiKey || 'sk-placeholder' })
}

// ═══════════════════════════════════════════════════
// تتبع الاستهلاك
// ═══════════════════════════════════════════════════

async function logUsage(params: {
  userId: string; feature: string; inputTokens: number; outputTokens: number; success: boolean
}) {
  try {
    const cost = (params.inputTokens / 1000) * COST_PER_1K_INPUT + (params.outputTokens / 1000) * COST_PER_1K_OUTPUT
    await (prisma as any).aiUsageLog?.create?.({
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
    const result = await (prisma as any).aiUsageLog?.aggregate?.({
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

    const start = Date.now()
    try {
      const response = await client.chat.completions.create({
        model: DEEPSEEK_MODEL,
        messages,
        max_tokens: opts.maxTokens ?? 800,
        temperature: opts.temperature ?? 0.7,
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
      }
    } catch (error: any) {
      console.error('[deepseek] chat error:', error?.message || error)
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
    return !!process.env.DEEPSEEK_API_KEY
  },
}
