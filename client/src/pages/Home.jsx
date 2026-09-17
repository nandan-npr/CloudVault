import Background from "../components/home/Background";
import Navbar from "../components/home/Navbar";
import Hero from "../components/home/Hero";
import Features from "../components/home/Features";
import CTA from "../components/home/CTA";
import Footer from "../components/home/Footer";

function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--cv-text)]">
      <Background />
      <Navbar />
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}

export default Home;
