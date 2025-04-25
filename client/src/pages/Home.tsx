import { useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import BenefitsSection from "@/components/home/BenefitsSection";
import CoursesSection from "@/components/home/CoursesSection";
import SecuritySection from "@/components/home/SecuritySection";
import CTASection from "@/components/home/CTASection";
import { Helmet } from "react-helmet";

export default function Home() {
  // Scroll to section if URL contains hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);
  
  return (
    <>
      <Helmet>
        <title>iAula - A Inteligência Artificial que Transforma a Educação</title>
        <meta name="description" content="iAula é uma plataforma de IA educacional que está revolucionando o modo como ensinamos e aprendemos no Brasil." />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" 
          rel="stylesheet"
        />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <HeroSection />
          <FeaturesSection />
          <BenefitsSection />
          <CoursesSection />
          <SecuritySection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
}
