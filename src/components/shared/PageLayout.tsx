import { ReactNode } from 'react'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/landing/Footer'

export default function PageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
