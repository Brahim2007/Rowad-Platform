import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clientIp, rateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

// Simple user-agent parser
function parseUA(ua: string) {
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|Brave|Samsung Browser|UCBrowser)\/([\d.]+)/)
    || ua.match(/(MSIE|Trident)\//)
  const os = ua.match(/(Windows NT|Mac OS X|Android|Linux|iOS|iPhone OS)\s?([\d._]+)?/)
  const mobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua)
  const tablet = /Tablet|iPad/i.test(ua) && !/Mobile/i.test(ua)

  return {
    browser: browser?.[1] === 'Trident' ? 'Internet Explorer' : (browser?.[1] || null),
    os: os?.[1]?.replace('Mac OS X', 'macOS').replace('Windows NT', 'Windows').replace('iPhone OS', 'iOS') || null,
    deviceType: tablet ? 'tablet' : (mobile ? 'mobile' : 'desktop'),
  }
}

// Geo IP lookup via free API
async function geoLookup(ip: string): Promise<{
  country: string | null; city: string | null; region: string | null;
  latitude: number | null; longitude: number | null
}> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,city,region,lat,lon,status`, {
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    if (data.status === 'success') {
      return {
        country: data.countryCode || null,
        city: data.city || null,
        region: data.region || null,
        latitude: data.lat ?? null,
        longitude: data.lon ?? null,
      }
    }
  } catch {
    // Silently fail — geo data is non-critical
  }
  return { country: null, city: null, region: null, latitude: null, longitude: null }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, visitorId, referrer, screenSize, language } = body

    if (!path) {
      return NextResponse.json({ success: false, message: 'path is required' }, { status: 400 })
    }

    // Skip admin and internal paths
    if (path.includes('/admin/') || path.includes('/_next/')) {
      return NextResponse.json({ success: true, data: { tracked: false } })
    }

    const ipAddress = clientIp(request)
    const visitorKey = visitorId ? `visitor:${String(visitorId).slice(0, 120)}` : `ip:${ipAddress}`
    const limit = rateLimit(`visit:${visitorKey}`, 120, 10 * 60 * 1000)
    if (!limit.success) {
      return rateLimitResponse('Too many tracking requests', limit.retryAfter)
    }

    // Geo IP lookup (parallel with UA parsing)
    const ip = ipAddress && ipAddress !== '127.0.0.1' && ipAddress !== '::1' ? ipAddress : ''
    const userAgent = request.headers.get('user-agent') || ''

    const [geo, parsed] = await Promise.all([
      ip ? geoLookup(ip) : Promise.resolve({ country: null, city: null, region: null, latitude: null, longitude: null }),
      Promise.resolve(parseUA(userAgent)),
    ])

    await prisma.visit.create({
      data: {
        path,
        visitorId: visitorId || null,
        ipAddress: ip || null,
        country: geo.country,
        city: geo.city,
        region: geo.region,
        latitude: geo.latitude,
        longitude: geo.longitude,
        deviceType: parsed.deviceType,
        browser: parsed.browser,
        os: parsed.os,
        referrer: referrer || null,
        userAgent: userAgent || null,
        screenSize: screenSize || null,
        language: language || null,
      },
    })

    return NextResponse.json({ success: true, data: { tracked: true } })
  } catch (error) {
    logger.error('Visit tracking error', error)
    return NextResponse.json({ success: false, message: 'Tracking failed' }, { status: 500 })
  }
}
