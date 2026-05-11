import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'شبكة الرواد الإلكترونية',
  description: 'منصة رقمية لتمكين الشباب العربي',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
