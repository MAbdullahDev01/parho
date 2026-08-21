import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Navbar } from "@/components/landing/Navbar";
import { TrustBanner } from "@/components/landing/TrustBanner";
import { TutorCards } from "@/components/landing/TutorCards";
import { ValueSplit } from "@/components/landing/ValueSplit";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-page">
      <Navbar />
      <Hero />
      <HowItWorks />
      <TrustBanner />
      <TutorCards />
      <ValueSplit />
      <FAQ />
      <Footer />
    </main>
  );
}