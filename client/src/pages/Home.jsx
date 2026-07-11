import Background from "../components/home/Background";
import Navbar from "../components/home/Navbar";
import Hero from "../components/home/Hero";
import Features from "../components/home/Features";
import DashboardPreview from "../components/home/DashboardPreview";
import Testimonials from "../components/home/Testimonials";
import Security from "../components/home/Security";
import CTA from "../components/home/CTA";
import Footer from "../components/home/Footer";

function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#faf7f2] text-[#1f1a17]">
      <Background />
      <Navbar />
      <Hero />
      <Features />
      <DashboardPreview />
      <Testimonials />
      <Security />
      <CTA />
      <Footer />
    </main>
  );
}

export default Home;