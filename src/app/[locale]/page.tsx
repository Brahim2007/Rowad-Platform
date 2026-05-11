import Navbar from '@/components/shared/Navbar'
import Hero from '@/components/landing/Hero'
import AboutNetwork from '@/components/landing/AboutNetwork'
import FeaturedPlatforms from '@/components/landing/FeaturedPlatforms'
import FeaturedProjects from '@/components/landing/FeaturedProjects'
import StatsCounter from '@/components/landing/StatsCounter'
import TeamCarousel from '@/components/landing/TeamCarousel'
import PartnersShowcase from '@/components/landing/PartnersShowcase'
import CTASection from '@/components/landing/CTASection'
import AdminLoginBanner from '@/components/landing/AdminLoginBanner'
import Footer from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AboutNetwork />
        <FeaturedPlatforms />
        <FeaturedProjects />
        <StatsCounter />
        <TeamCarousel />
        <PartnersShowcase />
        <CTASection />
        <AdminLoginBanner />
      </main>
      <Footer />
    </>
  )
}
