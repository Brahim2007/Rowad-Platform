/**
 * نظام البريد الإلكتروني لمنصة رواد
 *
 * يستخدم Nodemailer مع SMTP (يعمل مع أي مزود: Gmail, Resend, SendGrid, إلخ).
 * الفكرة: كل دوال الإرسال تستدعي sendEmail مع خيارات القالب.
 *
 * متغيرات البيئة المطلوبة:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { logger } from '@/lib/logger'

// ═══════════════════════════════════════════════════
// الـ Transporter — يُنشأ مرة واحدة
// ═══════════════════════════════════════════════════

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  // إن لم تكن الإعدادات موجودة، نستخدم إعدادات وهمية (للتطوير)
  if (!host || !user) {
    logger.warn('[email] SMTP غير مهيأ — سيتم تسجيل البريد بدل الإرسال')
    // إنشاء transporter لا يفعل شيئاً (للتطوير)
    transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      ignoreTLS: true,
    })
    return transporter
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  return transporter
}

// ═══════════════════════════════════════════════════
// دالة الإرسال العامة
// ═══════════════════════════════════════════════════

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  const from = process.env.EMAIL_FROM || 'noreply@rowad-network.org'
  try {
    await getTransporter().sendMail({
      from: `شبكة رواد الإلكترونية <${from}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })
  } catch (error) {
    // في بيئة التطوير أو عند الفشل: نسجّل فقط
    logger.info('[email] Send fallback', { to: opts.to, subject: opts.subject })
    logger.error('[email] Send error', error)
  }
}

// ═══════════════════════════════════════════════════
// القوالب
// ═══════════════════════════════════════════════════

function emailLayout(body: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin:0; padding:20px; }
  .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1e40af, #0d9488); color: #fff; padding: 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 20px; }
  .body { padding: 24px; color: #333; line-height: 1.8; font-size: 15px; }
  .code { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 16px; font-family: monospace; font-size: 16px; direction: ltr; text-align: center; margin: 12px 0; }
  .footer { padding: 16px 24px; background: #fafafa; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #888; }
  a { color: #1e40af; }
</style></head>
<body>
  <div class="container">
    <div class="header"><h1>شبكة رواد الإلكترونية</h1></div>
    <div class="body">${body}</div>
    <div class="footer">تم إرسال هذا البريد آلياً من منصة شبكة رواد الإلكترونية</div>
  </div>
</body></html>`
}

// ═══════════════════════════════════════════════════
// القوالب المحددة
// ═══════════════════════════════════════════════════

/** بريد ترحيبي بالعضو الجديد — يحتوي على بيانات الدخول */
export async function sendWelcomeEmail(params: {
  to: string
  memberName: string
  platformName: string
  tempPassword: string
  loginUrl: string
}) {
  const { to, memberName, platformName, tempPassword, loginUrl } = params
  await sendEmail({
    to,
    subject: 'مرحباً بك في شبكة رواد الإلكترونية',
    html: emailLayout(`
      <h2>مرحباً ${memberName} 👋</h2>
      <p>يسرنا إعلامك بأنه تم إنشاء حسابك في شبكة رواد الإلكترونية على منصة <b>${platformName}</b>.</p>
      <p>بيانات الدخول الخاصة بك:</p>
      <div class="code">
        البريد الإلكتروني: ${to}<br>
        كلمة المرور: ${tempPassword}
      </div>
      <p style="color:#e53935;font-size:13px;">⚠️ يرجى تغيير كلمة المرور بعد أول تسجيل دخول.</p>
      <p style="margin-top:20px;text-align:center;">
        <a href="${loginUrl}" style="display:inline-block;padding:10px 24px;background:#1e40af;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">تسجيل الدخول</a>
      </p>
    `),
  })
}

/** إشعار اعتماد نشاط */
export async function sendActivityApprovedEmail(params: {
  to: string
  memberName: string
  activityName: string
  points: number
  note?: string
}) {
  const { to, memberName, activityName, points, note } = params
  await sendEmail({
    to,
    subject: `✅ تم اعتماد نشاطك — +${points} نقطة`,
    html: emailLayout(`
      <h2>تهانينا ${memberName} 🎉</h2>
      <p>تم اعتماد نشاطك <b>"${activityName}"</b> وإضافة <b>${points} نقطة</b> إلى رصيدك.</p>
      ${note ? `<p style="background:#f0fdf4;border-radius:8px;padding:10px;border:1px solid #bbf7d0;">📝 ملاحظة المدير:<br>${note}</p>` : ''}
      <p style="margin-top:20px;text-align:center;color:#666;">استمر في العطاء — كل نقطة تقرّبك من المستوى التالي 🚀</p>
    `),
  })
}

/** إشعار رفض نشاط */
export async function sendActivityRejectedEmail(params: {
  to: string
  memberName: string
  activityName: string
  reason: string
}) {
  const { to, memberName, activityName, reason } = params
  await sendEmail({
    to,
    subject: 'لم يُعتمد نشاطك — راجع السبب',
    html: emailLayout(`
      <h2>نعتذر ${memberName}</h2>
      <p>لم يتم اعتماد نشاطك <b>"${activityName}"</b>.</p>
      <p style="background:#fef2f2;border-radius:8px;padding:10px;border:1px solid #fecaca;">❌ سبب الرفض:<br><b>${reason}</b></p>
      <p style="color:#666;">يمكنك تعديل النشاط وإعادة إرساله بعد معالجة الملاحظات.</p>
    `),
  })
}

/** تذكير مدير المنصة بوجود أنشطة معلقة */
export async function sendPendingReminderEmail(params: {
  to: string
  managerName: string
  platformName: string
  pendingCount: number
  dashboardUrl: string
}) {
  const { to, managerName, platformName, pendingCount, dashboardUrl } = params
  await sendEmail({
    to,
    subject: `⏳ تذكير: ${pendingCount} أنشطة تنتظر مراجعتك`,
    html: emailLayout(`
      <h2>مرحباً ${managerName}</h2>
      <p>لديك <b>${pendingCount} أنشطة</b> تنتظر مراجعتك في منصة <b>${platformName}</b>.</p>
      <p style="margin-top:20px;text-align:center;">
        <a href="${dashboardUrl}" style="display:inline-block;padding:10px 24px;background:#d97706;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">مراجعة الأنشطة</a>
      </p>
    `),
  })
}
