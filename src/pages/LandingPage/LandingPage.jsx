import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "../../components/layout/Navbar";
import { Button } from "../../components/ui/Button";
import { SpotlightText } from "../../components/ui/SpotlightText";
import { AuthModal } from "../../components/auth/AuthModal";

// Import assets
import HeroImg from "../../assets/HeroSection.svg";
import AboutImg from "../../assets/AboutSection.svg";
import HowItWorks1 from "../../assets/HowItWorks1Section.svg";
import HowItWorks2 from "../../assets/HowItWorks2Section.svg";
import HowItWorks3 from "../../assets/HowItWorks3Section.svg";
import Expert1 from "../../assets/Expert1Section.svg";
import Expert2 from "../../assets/Expert2Section.svg";
import Testimonial1 from "../../assets/Testimonial1Section.svg";
import Testimonial2 from "../../assets/Testimonial2Section.svg";
import Testimonial3 from "../../assets/Testimonial3Section.svg";
import Testimonial4 from "../../assets/Testimonial4Section.svg";
import Testimonial5 from "../../assets/Testimonial5Section.svg";
import Testimonial6 from "../../assets/Testimonial6Section.svg";
import FooterImg from "../../assets/FooterSection.svg";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const faqs = [
  {
    question: "How does the smart assessment actually work?",
    answer: "Our Expert System asks you a series of gentle, carefully designed questions about what you've been experiencing lately. It uses advanced clinical logic to analyze your symptoms, giving you a clearer picture of your mental health and recommending the most appropriate type of specialist for your specific needs."
  },
  {
    question: "Are the psychologists and psychiatrists fully licensed?",
    answer: "Yes, all of our professionals are fully certified and licensed to provide the best care."
  },
  {
    question: "Can I choose between online sessions and in-person visits?",
    answer: "Absolutely! We offer flexible options so you can choose what works best for your schedule and comfort level."
  },
  {
    question: "Is my personal information and assessment data kept private?",
    answer: "Your privacy is our top priority. We use end-to-end encryption to ensure that your data is secure and confidential."
  },
  {
    question: "What if I am in a crisis right now?",
    answer: "If you are in a crisis or emergency, please contact your local emergency services or a crisis hotline immediately."
  }
];

const steps = [
  {
    title: "Share What You're Experiencing",
    image: HowItWorks1,
    desc: (
      <>
        Start with our safe, guided screening. There's no <br className="hidden lg:block" />
        judgment here just an intelligent tool designed <br className="hidden lg:block" />
        to understand what you're going through.
      </>
    )
  },
  {
    title: "Find Your Perfect Fit",
    image: HowItWorks2,
    desc: (
      <>
        We take the guesswork out of therapy. Based on <br className="hidden lg:block" />
        your results, we connect you with the right <br className="hidden lg:block" />
        psychologist or psychiatrist for you.
      </>
    )
  },
  {
    title: "Start Healing, Your Way",
    image: HowItWorks3,
    desc: (
      <>
        Whether you prefer talking from the comfort of <br className="hidden lg:block" />
        your couch or visiting a local expert face-to-face, <br className="hidden lg:block" />
        we make your first session easy to schedule.
      </>
    )
  }
];

const testimonialsData = [
  {
    image: Testimonial1,
    text: "The smart screener took away all the anxiety of figuring out 'what's wrong with me'. It gave me immediate clarity.",
    author: "Daniel, 24"
  },
  {
    image: Testimonial2,
    text: "I prefer speaking to a doctor face-to-face. The platform instantly found a highly-rated clinic right in my neighborhood.",
    author: "Martha, 20"
  },
  {
    image: Testimonial3,
    text: "Being able to talk to a certified psychiatrist from the safety of my own living room gave me the courage to finally seek help.",
    author: "Bob, 30"
  },
  {
    image: Testimonial4,
    text: "After years of trying different therapists, this platform finally matched me with a psychologist who specializes in exactly what I need.",
    author: "Helena, 26"
  },
  {
    image: Testimonial5,
    text: "I've struggled to find the right therapist for years. This system matched me perfectly, I felt truly understood from day one.",
    author: "James, 30"
  },
  {
    image: Testimonial6,
    text: "I was intimidated by the idea of seeing a psychiatrist. The gentle screening gave me the confidence to finally book my first local clinic visit.",
    author: "Michele, 24"
  }
];

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Ignore if user is already scrolling horizontally (trackpad)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      if (e.deltaY !== 0 && !e.shiftKey) {
        const isScrollingDown = e.deltaY > 0;
        const isScrollingUp = e.deltaY < 0;
        const maxScroll = container.scrollWidth - container.clientWidth;

        // If at the edges, allow native vertical scroll
        if ((isScrollingDown && container.scrollLeft >= maxScroll - 5) || 
            (isScrollingUp && container.scrollLeft <= 0)) {
          return;
        }

        e.preventDefault();
        // Smooth scroll by the delta amount, multiplying for speed
        container.scrollLeft += e.deltaY * 1.5;
      }
    };

    // Use passive: false to allow e.preventDefault()
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Hero Section */}
      <section className="relative px-4 md:px-8 pt-24 pb-12 max-w-[1650px] mx-auto">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } }
          }}
          className="w-full bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100/50"
        >
          {/* Image Container */}
          <div className="w-full h-[50vh] md:h-[65vh] relative bg-gray-200">
            <img 
              src={HeroImg} 
              alt="Komorebi Hero" 
              className="w-full h-full object-cover" 
            />
          </div>
          
          {/* Text Container */}
          <div className="px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-14 flex flex-col lg:flex-row lg:items-end justify-between gap-8 overflow-hidden">
            <motion.h1 
              variants={{
                hidden: { opacity: 0, x: -50 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut", delay: 0.3 } }
              }}
              className="text-[40px] md:text-6xl lg:text-[68px] xl:text-[72px] font-heading text-[#5D8B66] leading-[1.1] whitespace-nowrap"
            >
              Your First Step Toward<br />Feeling Like Yourself Again.
            </motion.h1>
            <motion.p 
              variants={{
                hidden: { opacity: 1 },
                visible: { opacity: 1, transition: { staggerChildren: 0.01, delayChildren: 0.8 } }
              }}
              className="text-[11px] lg:text-[12px] text-[#5D8B66]/80 text-right lg:max-w-[360px] leading-[1.6] font-sans lg:pb-3 self-end lg:self-auto"
            >
              {"Stop second-guessing how you feel. Our advanced screening system accurately evaluates your symptoms to connect you with certified psychiatrists and psychologists who specialize in exactly what you're going through.".split(" ").map((word, wordIndex) => (
                <span key={`word-${wordIndex}`} className="inline-block whitespace-pre">
                  {word.split("").map((char, charIndex) => (
                    <motion.span key={`char-${charIndex}`} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                      {char}
                    </motion.span>
                  ))}
                  {" "}
                </span>
              ))}
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* About Section (Our Stories) */}
      <section id="stories" className="px-10 md:px-16 py-20 max-w-[1650px] mx-auto bg-white">
        <div className="w-full flex flex-col items-center text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="w-full"
          >
            <SpotlightText 
              className="w-full mb-16 mx-auto text-center"
              textClassName="text-[28px] md:text-4xl lg:text-[36px] xl:text-[40px] leading-[1.4]"
            >
              Mental health journeys rarely start with clear answers. Too often, people <br className="hidden xl:block" />
              spend months trying to figure out what they are feeling and who they <br className="hidden xl:block" />
              should talk to. We built this platform because we believe getting the <br className="hidden xl:block" />
              right care shouldn't feel like a guessing game.
            </SpotlightText>
            
            {/* Image Container */}
            <div className="w-full h-[30vh] md:h-[45vh] lg:h-[50vh] xl:h-[55vh] relative bg-gray-100 rounded-[32px] overflow-hidden shadow-sm">
              <img 
                src={AboutImg} 
                alt="Our Stories" 
                className="w-full h-full object-cover" 
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-4 md:px-16 py-16 md:py-24 max-w-[1650px] mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-5xl lg:text-[56px] font-heading text-[#5D8B66] mb-8 md:mb-10 px-4">
            Your Path to Feeling Better in 3 Simple Steps
          </h2>
          
          <div className="flex flex-col md:flex-row justify-between items-center bg-[#43674F] rounded-3xl md:rounded-full p-2 md:p-2 w-full mx-auto shadow-sm gap-2 md:gap-0">
            {steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`flex-1 w-full text-center px-4 py-3 md:py-4 rounded-2xl md:rounded-full text-[14px] md:text-[18px] transition-all duration-300 font-medium md:font-normal ${
                  activeStep === idx 
                    ? "bg-gradient-to-r from-[#5F916F] to-[#94B59F] border border-white/30 text-white shadow-sm" 
                    : "text-white/80 hover:text-white border border-transparent"
                }`}
              >
                {step.title}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full h-[60vh] md:h-[75vh] xl:h-[80vh] rounded-[32px] overflow-hidden bg-gray-100 shadow-sm mt-4 md:mt-0">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 w-full h-full"
            >
              <img 
                src={steps[activeStep].image} 
                alt={steps[activeStep].title} 
                className={`w-full h-full object-cover transition-transform duration-500 ${activeStep === 1 ? "scale-105 object-[center_85%]" : "object-[center_20%]"}`} 
              />
              
              {/* Info Card - Docked to bottom on mobile, bottom-right on desktop */}
              <div className="absolute bottom-0 left-0 right-0 md:left-auto md:right-0 bg-white/95 md:bg-white backdrop-blur-sm md:backdrop-blur-none rounded-t-[24px] md:rounded-t-none md:rounded-tl-[32px] p-5 md:p-8 w-full md:max-w-[450px] lg:max-w-[500px] shadow-2xl">
                <p className="text-[#5D8B66] text-[14px] md:text-[16px] lg:text-[18px] font-medium leading-[1.6]">
                  {steps[activeStep].desc}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Experts Section */}
      <section id="expert" className="px-10 md:px-16 py-24 max-w-[1650px] mx-auto bg-white">
        <div className="text-center mb-12">
          <motion.h2 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
            className="text-4xl md:text-5xl lg:text-[52px] font-heading text-[#5D8B66] mb-4"
          >
            Real Experts. Matching Your Comfort Level.
          </motion.h2>
          <motion.p 
            initial="hidden" whileInView="visible" viewport={{ once: true, transition: { delay: 0.1 } }} variants={fadeIn}
            className="text-[15px] md:text-[16px] text-[#5D8B66]/90 max-w-[700px] mx-auto font-sans leading-relaxed"
          >
            Healing looks different for everyone. That's why we give you access to top-tier psychologists
            <br className="hidden md:block" />
            and psychiatrists, with the freedom to choose how you want to meet.
          </motion.p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Card */}
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} 
            className="group relative flex flex-col rounded-[32px] overflow-hidden border border-gray-200/80 bg-white shadow-sm h-[550px] md:h-[750px] lg:h-[800px] xl:h-[850px]"
          >
            <img src={Expert1} alt="Expert 1" className="w-full h-full object-cover object-top" />
            
            {/* Text Box (Animated on hover) */}
            <div className="absolute bottom-0 left-0 right-0 px-8 py-8 md:px-10 md:py-8 bg-white flex flex-col justify-center transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out">
              <h3 className="text-xl md:text-2xl font-medium text-[#5D8B66] mb-3">Therapy from Home</h3>
              <p className="text-[#5D8B66]/80 text-[14px] md:text-[16px] leading-relaxed">
                Skip the commute. Speak to a dedicated expert via secure online video calls from a space where you feel safest.
              </p>
            </div>
          </motion.div>
          
          {/* Right Card */}
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, transition: { delay: 0.2 } }} variants={fadeIn} 
            className="group relative rounded-[32px] overflow-hidden shadow-sm border border-gray-200/50 h-[550px] md:h-[750px] lg:h-[800px] xl:h-[850px]"
          >
            <img src={Expert2} alt="Expert 2" className="w-full h-full object-cover object-top" />

            {/* Text Box (Animated on hover) */}
            <div className="absolute bottom-0 left-0 right-0 px-8 py-8 md:px-10 md:py-8 bg-white flex flex-col justify-center transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out">
              <h3 className="text-xl md:text-2xl font-medium text-[#5D8B66] mb-3">Local Clinic Visits</h3>
              <p className="text-[#5D8B66]/80 text-[14px] md:text-[16px] leading-relaxed">
                Meet your doctor in a supportive, physical clinical environment. We track your location to surface nearby experts ready to welcome you.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-4 md:px-8 py-24 max-w-[900px] mx-auto">
        <div className="text-center mb-12">
          <motion.h2 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
            className="text-4xl md:text-5xl lg:text-[56px] font-heading text-[#5D8B66] mb-4"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true, transition: { delay: 0.1 } }} variants={fadeIn}
            className="text-[15px] md:text-[16px] text-[#5D8B66] font-sans"
          >
            Have a question about how our platform works? Find the answers you need below.
          </motion.p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
              key={idx}
              onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
              className={`cursor-pointer overflow-hidden transition-all duration-300 rounded-[16px] md:rounded-[20px] ${
                openFaq === idx 
                  ? "bg-gradient-to-r from-[#5F916F] to-[#94B59F] border border-white/30 text-white shadow-md"
                  : "bg-white border border-[#5D8B66]/30 hover:border-[#5D8B66]/50 shadow-sm"
              }`}
            >
              <div className="px-6 py-5 md:px-8 md:py-5 flex justify-between items-center">
                <h3 className={`font-medium text-[16px] md:text-[18px] ${openFaq === idx ? "text-white" : "text-[#455A4A]"}`}>
                  {faq.question}
                </h3>
                <span className={`text-xl md:text-2xl font-light ml-4 flex-shrink-0 ${openFaq === idx ? "text-white" : "text-[#5D8B66]"}`}>
                  {openFaq === idx ? "—" : "+"}
                </span>
              </div>
              
              <AnimatePresence initial={false}>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 md:px-8 md:pb-6 pt-0">
                      <p className="text-white/95 text-[14px] md:text-[15px] leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          
          <motion.button 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
            className="w-full mt-6 py-4 rounded-full bg-gradient-to-r from-[#5F916F] to-[#94B59F] text-white font-medium text-[16px] hover:brightness-110 transition-all border border-white/30 shadow-sm"
          >
            Ask Another Question
          </motion.button>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-10 md:px-16 py-24 max-w-[1650px] mx-auto overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <h2 className="text-4xl md:text-5xl lg:text-[56px] font-heading text-[#5D8B66] leading-[1.1] text-left">
            The Support You Need,<br />Exactly How You Need It
          </h2>
          <p className="text-[#5D8B66]/80 text-[14px] md:text-[16px] font-medium md:pb-3 text-left md:text-right">
            Based on 2,500+ reviews
          </p>
        </div>
        
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-6 pb-8 items-stretch [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {testimonialsData.map((item, idx) => (
            <div key={idx} className="w-[85vw] md:w-[350px] lg:w-[380px] h-auto shrink-0 bg-white rounded-[24px] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              <div className="w-full aspect-[4/3] relative shrink-0 rounded-t-[24px] overflow-hidden">
                <img src={item.image} alt={`Review ${idx + 1}`} className="w-full h-full object-cover object-top rounded-t-[24px]" />
              </div>
              <div className="p-6 md:p-8 flex flex-col flex-1 justify-between gap-4">
                <p className="text-[#5D8B66] text-[14px] md:text-[15px] leading-relaxed font-medium">
                  {item.text}
                </p>
                <p className="text-[#5D8B66]/60 text-[13px] md:text-[14px]">
                  — {item.author}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-10 md:px-16 pb-12 pt-12 max-w-[1650px] mx-auto relative">
        <div className="w-full flex flex-col bg-white">
          {/* Top Image Banner */}
          <div className="w-full relative h-[350px] md:h-[500px] rounded-[32px] overflow-hidden shadow-sm flex items-end">
            <img src={FooterImg} alt="Clear Answers" className="absolute inset-0 w-full h-full object-cover object-[center_30%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="relative w-full px-8 pb-3">
              <h2 className="w-full hidden md:flex justify-between text-[#CDDDD2] text-5xl lg:text-[72px] xl:text-[82px] font-heading leading-none">
                <span>Clear</span>
                <span>Answers.</span>
                <span>Compassionate</span>
                <span>Care.</span>
              </h2>
              <h2 className="w-full md:hidden text-center text-[#CDDDD2] text-4xl font-heading leading-tight">
                Clear Answers.<br/>Compassionate Care.
              </h2>
            </div>
          </div>

          {/* Stats Section */}
          <div className="pt-10 pb-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-12 md:gap-4 w-full">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="text-[#5D8B66] text-4xl md:text-5xl lg:text-[56px] font-sans font-medium mb-3">25,000+</h3>
              <p className="text-gray-400 text-[13px] md:text-[15px] font-sans font-medium">Assessments Completed</p>
            </div>
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="text-[#5D8B66] text-4xl md:text-5xl lg:text-[56px] font-sans font-medium mb-3">500+</h3>
              <p className="text-gray-400 text-[13px] md:text-[15px] font-sans font-medium">Licensed Psychologists & Psychiatrists</p>
            </div>
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="text-[#5D8B66] text-4xl md:text-5xl lg:text-[56px] font-sans font-medium mb-3">4.9/5</h3>
              <p className="text-gray-400 text-[13px] md:text-[15px] font-sans font-medium">Patient Care Rating</p>
            </div>
            <div className="flex flex-col items-center md:items-end text-center md:text-right">
              <h3 className="text-[#5D8B66] text-4xl md:text-5xl lg:text-[56px] font-sans font-medium mb-3">92%</h3>
              <p className="text-gray-400 text-[13px] md:text-[15px] font-sans font-medium">Accurate Initial Match Rate</p>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100 mb-10"></div>

          {/* Links Section */}
          <div className="flex flex-wrap gap-12 justify-between pb-32 relative z-10 w-full">
            <div className="flex flex-col gap-5 min-w-[200px]">
              <h4 className="text-[#5D8B66] font-sans font-medium mb-2 text-[15px]">Explore</h4>
              <a href="#" className="text-gray-400 hover:text-[#5D8B66] transition-colors font-sans text-[14px]">How It Works</a>
              <a href="#" className="text-gray-400 hover:text-[#5D8B66] transition-colors font-sans text-[14px]">Our Experts</a>
              <a href="#" className="text-gray-400 hover:text-[#5D8B66] transition-colors font-sans text-[14px]">Testimonials</a>
              <a href="#" className="text-gray-400 hover:text-[#5D8B66] transition-colors font-sans text-[14px]">FAQs</a>
            </div>
            <div className="flex flex-col gap-5 min-w-[200px]">
              <h4 className="text-[#5D8B66] font-sans font-medium mb-2 text-[15px]">Legal & Trust</h4>
              <a href="#" className="text-gray-400 hover:text-[#5D8B66] transition-colors font-sans text-[14px]">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-[#5D8B66] transition-colors font-sans text-[14px]">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-[#5D8B66] transition-colors font-sans text-[14px]">Healthcare Data Safety</a>
              <a href="#" className="text-gray-400 hover:text-[#5D8B66] transition-colors font-sans text-[14px]">Informed Consent</a>
            </div>
            <div className="flex flex-col gap-5 min-w-[200px] md:text-right">
              <h4 className="text-[#5D8B66] font-sans font-medium mb-2 text-[15px]">Reach Out</h4>
              <a href="#" className="text-gray-400 hover:text-[#5D8B66] transition-colors font-sans text-[14px]">Support Center</a>
              <a href="#" className="text-gray-400 hover:text-[#5D8B66] transition-colors font-sans text-[14px]">Contact Us</a>
              <a href="#" className="text-gray-400 hover:text-[#5D8B66] transition-colors font-sans text-[14px]">Partner Clinics</a>
            </div>
          </div>
          
          {/* Giant Watermark */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none z-0">
            <h1 className="w-full flex justify-between px-4 text-[18vw] xl:text-[230px] font-heading text-[#5D8B66]/5 leading-[0.75] select-none">
              <span>K</span><span>O</span><span>M</span><span>O</span><span>R</span><span>E</span><span>B</span><span>I</span>
            </h1>
          </div>
        </div>
      </footer>
    </div>
  );
}
